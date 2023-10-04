import { col, where, Op } from 'sequelize'
import schemas from '../schemas/index.js'
import Shared from './shared.js'
import tbl_venda_ingressos from '../schemas/ticketsl_promo/tbl_venda_ingressos.js'

const {
    tbl_eventos,
    tbl_ingressos,
    caixa,
    venda,
    venda_item,
    tbl_pdvs,
    tbl_classes_ingressos,
    tbl_classe_numeracao,
    tbl_classe_ingressos_solidario,
    tbl_categorias_classes_ingressos,
    tbl_meio_pgto,
} = schemas.ticketsl_promo

const {
    lltckt_category_to_promoter,
    lltckt_category,
    lltckt_eve_categorias,
    lltckt_order_product,
    lltckt_order,
    lltckt_order_product_barcode,
} = schemas.ticketsl_loja

/**
 * Regras de negócio dos Eventos
 */
export default class Eventos {

    /**
     * Define o status da venda.
     * 
     * @param {number} status_id Id do status
     * @param {boolean} order Venda pelo site
     */
    static set_status(status_id, order) {
        if(order) {
            switch(status_id) {
                case 1:
                    return 'AGUARD. PAGAMENTO'
                
                case 5:
                    return 'APROVADO'
                
                case 6:
                    return 'ESTORNADO'
                
                case 7:
                    return 'NÃO APROVADO'
                
                case 21:
                    return 'AGUARD. PIX'
                
                default: return '-'
            }
        }
        else {
            switch(status_id) {
                case 0:
                    return 'AGUARD. PAGAMENTO'
                
                case 1:
                case 2:
                    return 'APROVADO'
                
                case 3:
                    return 'ESTORNADO'
                
                default: return '-'
            }
        }
    }

    /**
     * Retorna a lista dos Eventos do Promotor
     * na tela home.
     * 
     * @param {number} user_id Id do Promotor
     * @param {number?} evento Filtro por evento
     * @param {number|string|null} tipo Filtro entre eventos:
     * - `0`: `Todos` (padrão);
     * - `1`: `Correntes`;
     * - `2`: `Encerrados`.
     * @param {number|string|null} pagina Página dos retornos
     * @returns 
     */
    static async getEventos(user_id, evento, tipo, pagina) {
        // Auxiliar da página
        let p = !!pagina ? parseInt(pagina) : 1

        // 00:00 hora do dia atual
        let dia_hoje = new Date()
        dia_hoje.setHours(0,0,0)

        let status_evento
        switch(parseInt(tipo)) {
            // Correntes
            case 1:
                status_evento = { eve_data: { $gte: dia_hoje } }
                break

            // Encerrados
            case 2:
                status_evento = { eve_data: { $lt: dia_hoje } }
                break

            // Todos
            default:
                status_evento = {}
                break
        }
        
        // Retorna os eventos do promotor
        return await lltckt_eve_categorias.findAndCountAll({
            
            // Paginação
            offset: (p -1) * 10,
            limit: 10,

            // Filtro por evento
            where: {
                codEvePdv: !!evento ? evento : { $not: null }
            },

            attributes: ['codCatSite'],
            order: [[col('tbl_evento.eve_data'), 'asc']],
            subQuery: false,
            include: [
                // Eventos
                {
                    model: tbl_eventos,
                    required: true,
                    attributes: [
                        'eve_cod',
                        'eve_nome',
                        'eve_data',
                        'eve_local',
                        'eve_cidade'
                    ],

                    // Filtro pelo status do evento
                    where: { ...status_evento },

                    // Ingressos emitidos
                    include: {
                        model: tbl_ingressos,
                        separate: true,
                        required: false,
                        where: {
                            // Filtro de ingressos não cancelados
                            ing_status: [1, 2],
                            $or: [
                                { ing_pdv: { $not: null }},
                                where(col('lltckt_order_product_barcode.barcode'), Op.not, null)
                            ]
                        },
                        attributes: [
                            'ing_evento',
                            'ing_valor',
                            'ing_taxa',
                            'ing_data_compra'
                        ],

                        // Ingresso no site
                        include: {
                            model: lltckt_order_product_barcode,
                            required: false,
                            attributes: [],
                            include: {
                                model: lltckt_order_product,
                                required: true,
                                attributes: [],
                                include: {
                                    model: lltckt_order,
                                    required: true,
                                    attributes: [],

                                    // Filtro de ingressos não cancelados
                                    where: { order_status_id: 5 }
                                }
                            }
                        }
                    }
                },

                // Evento no site
                {
                    model: lltckt_category,
                    required: true,
                    attributes: [
                        'local',
                        'local2'
                    ],

                    // Filtro por promotor
                    include: {
                        model: lltckt_category_to_promoter,
                        required: true,
                        where: { id_promoter: { $like: user_id } },
                        attributes: [ 'id_Category' ]
                    }
                }
            ]
        })
        .then(({ rows, count }) => ({
            pagina: p,
            total: Math.ceil(count / 10),
            eventos: rows.map(a => {
                // Dados do evento
                let evento = a.getDataValue('tbl_evento')?.dataValues

                // Dados do local do evento
                let category = a.getDataValue('lltckt_category')?.dataValues

                // Data do evento
                let date_aux = new Date(evento.eve_data)

                // Formata a data do evento
                evento.eve_data = Shared.getFullDate(date_aux)

                // Calcula os dias até o início do evento
                const days_to = Shared.calcDaysBetween(date_aux, dia_hoje)
                if(days_to > 0)
                    evento.inicio_evento = `Faltam ${days_to.toLocaleString('pt-BR')} dias`
                else if(days_to < 0)
                    evento.inicio_evento = 'Encerrado'
                else
                    evento.inicio_evento = 'Hoje'

                // Local do evento
                evento.local = category?.local2 ?? evento.eve_local
                evento.cidade = category?.local ?? evento.eve_cidade

                // Id do evento no site
                evento.categoria = a.getDataValue('codCatSite')

                // Calcula as vendas do evento
                let vendido_hoje = 0        // Vendidos hoje
                let vendido_total = 0       // Total vendidos
                let cortesias_pdv_hoje = 0  // Cortesias hoje
                let cortesias_pdv_total = 0 // Total de cortesias
                let receitas_hoje = 0       // Receita faturada hoje
                let receitas_total = 0      // Receita total
                let taxas_total = 0         // Total de taxas

                evento.tbl_ingressos.map(ing => {
                    let valor = parseFloat(ing.ing_valor)
                    let taxa = parseFloat(ing.ing_taxa)

                    // Ingresso emitido hoje
                    if(ing.ing_data_compra > dia_hoje) {
                        // Ingresso vendido
                        if(valor > 0) {
                            vendido_hoje++
                            receitas_hoje += valor
                        }
                        // Cortesia
                        else {
                            cortesias_pdv_hoje++
                        }
                    }

                    // Ingresso vendido
                    if(valor > 0) {
                        vendido_total++
                        receitas_total += valor
                    }
                    // Cortesia
                    else {
                        cortesias_pdv_total++
                    }

                    // Taxas
                    taxas_total += taxa
                })

                evento.vendido_hoje = vendido_hoje
                evento.vendido_total = vendido_total
                evento.cortesias_pdv_hoje = cortesias_pdv_hoje
                evento.cortesias_pdv_total = cortesias_pdv_total
                evento.receitas_hoje = Shared.moneyFormat(receitas_hoje)
                evento.receitas_total = Shared.moneyFormat(receitas_total)
                evento.taxas_total = Shared.moneyFormat(taxas_total)

                delete evento.tbl_ingressos

                return evento
            })
        }))
    }

    /**
     * Retorna a situação das vendas do Evento.
     * 
     * @param {number} user_id Id do Promotor
     * @param {number} evento Id do evento
     * @param {number} categoria Id do evento no site
     * @returns 
     */
    static async getInfo(user_id, evento, categoria) {
        // Obtêm os dados das vendas do evento
        const promises = [
            // Situação do evento
            tbl_eventos.findByPk(evento, {
                attributes: [
                    'eve_inicio',
                    'eve_fim',
                    'eve_data'
                ]
            })
            .then(result => {
                const data = result.get()
                const today = new Date()
    
                let inicio_venda
                let status_venda
                let inicio_evento
    
                // Data de início das vendas do evento
                inicio_venda = Shared.getFullDate(data.eve_inicio)
    
                // Calcula os dias desde que as vendas foram iniciadas
                const since_start = Shared.calcDaysBetween(today, data.eve_inicio)
                if(since_start >= 0)
                    status_venda = `Iniciado a ${since_start.toLocaleString('pt-BR')} dias`
                else
                    status_venda = 'Finalizado'
    
    
                // Calcula os dias até o início do evento
                const days_to = Shared.calcDaysBetween(data.eve_data, today)
                if(days_to > 0)
                    inicio_evento = `Faltam ${days_to} dias`
                else if(days_to < 0)
                    inicio_evento = 'Encerrado'
                else
                    inicio_evento = 'Hoje'

                // Situação do evento
                return {
                    inicio_venda,
                    status_venda,
                    inicio_evento,
                    since_start
                }
            }),

            // Faturamentos
            new Promise(async (resolve, _) => {
                const faturamentos = [
                    new Promise(async (resolve, _) => {
                        // Faturamentos do site - início
                        let site = {
                            dinheiro: 0,
                            credito: 0,
                            debito: 0,
                            pix: 0,
                            total: 0
                        }

                        // Calcula os faturamento do site
                        await lltckt_order.findAll({
                            where: {
                                category_id: categoria,
                                order_status_id: 5
                            },
                            attributes: [ 'payment_method' ],
                            include: {
                                model: lltckt_order_product,
                                attributes: [ 'total' ],
                                required: true,
                                /*
                                    Algumas rows estão quebradas, sendo necessário um filtro forçado
                                    entre as 'orders' com ligação com algum registro de ingressos
                                    no schema 'ticketsl_promo'
                                */
                                include: {
                                    model: lltckt_order_product_barcode,
                                    required: true
                                }
                            }
                        })
                        .then(orders => {
                            orders.map(({ dataValues: order }) => {
                                let valor = parseFloat(order.lltckt_order_product.total)
                                switch (order.payment_method) {
                                    // Crédito/Débito?
                                    case 'PagSeguro':
                                        site.credito += valor
                                        break;
                                    
                                    // PIX
                                    case 'PIX':
                                        site.pix += valor
                                        break;

                                    default:
                                        break;
                                }
                            })
                        })

                        // Calcula o faturamento total no site
                        site.total = Object.entries(site)
                        .map(([_, value]) => value)
                        .reduce((prev, next) => (
                            prev + next
                        ), 0)

                        // Formata os faturamentos do site
                        Object.entries(site).map(([key]) => {
                            site[key] = Shared.moneyFormat(site[key])
                        })

                        // Faturamentos do site - fim

                        resolve(site)
                    }),

                    new Promise(async (resolve, _) => {
                        // Faturamento dos PDVs - início
                        let pdv = {
                            dinheiro: 0,
                            credito: 0,
                            debito: 0,
                            pix: 0,
                            total: 0
                        }

                        // Calcula os faturamento dos PDVs
                        await tbl_ingressos.findAll({
                            where: {
                                ing_evento: evento,
                                ing_pdv: { $not: null },
                                ing_status: { $in: [ 1, 2 ] }
                            },
                            attributes: [
                                'ing_valor',
                                'ing_mpgto'
                            ]
                        })
                        .then(ingressos => {
                            ingressos.map(({ dataValues: ingresso }) => {
                                let valor = parseFloat(ingresso.ing_valor)
                                switch(ingresso.ing_mpgto) {
                                    // Dinheiro
                                    case 1:
                                        pdv.dinheiro += valor
                                        break;

                                    // Crédito
                                    case 2:
                                        pdv.credito += valor
                                        break;
                                    
                                    // Débito
                                    case 3:
                                        pdv.debito += valor
                                        break;
                                    
                                    // PIX
                                    case 4:
                                        pdv.pix += valor
                                        break;
                                    
                                    default: break;
                                }
                            })
                        })

                        // Calcula o faturamento total nos PDVs
                        pdv.total = Object.entries(pdv)
                        .map(([_, value]) => value)
                        .reduce((prev, next) => (
                            prev + next
                        ), 0)

                        Object.entries(pdv).map(([key]) => {
                            pdv[key] = Shared.moneyFormat(pdv[key])
                        })

                        // Faturamento dos PDVs - fim
                        resolve(pdv)  
                    })
                ]

                await Promise.all(faturamentos).then(result => {
                    resolve({
                        faturamentos: {
                            site: result[0],
                            pdv: result[1]
                        }
                    })
                })
            }),

            this.getEventos(user_id, evento)
            .then(({ eventos: result }) => {
                let {
                    // Ingressos Emitidos
                    vendido_hoje,
                    vendido_total,
                    cortesias_pdv_hoje,
                    cortesias_pdv_total,

                    receitas_total,
                } = result[0]

                // Ingressos Emitidos
                let total_vendido_hoje = vendido_hoje + cortesias_pdv_hoje
                let total_vendido = vendido_total + cortesias_pdv_total

                // Ticket Médio
                let receitas = Shared.moneyToFloat(receitas_total)
                let ticket_medio = Shared.moneyFormat(receitas / (vendido_total))

                return {
                    // Ingressos Emitidos
                    vendido_hoje,
                    vendido_total,
                    cortesias_pdv_hoje,
                    cortesias_pdv_total,
                    total_vendido_hoje,
                    total_vendido,

                    receitas_total,

                    // Ticket Médio
                    ticket_medio
                }
            }),

            // Info Geral Bar
            caixa.findAll({
                where: { EVENTO_CODIGO: evento },
                attributes: ['CODIGO'],
                include: {
                    model: venda,
                    attributes: ['VALOR_TOTAL'],
                    include: {
                        model: venda_item,
                        attributes: ['QUANTIDADE']
                    }
                }
            })
            .then(result => {
                let qtde_caixas = result.length
                let faturamento_bar = 0

                let vendas = []
                result.map(({ dataValues: caixa }) => (
                    caixa.vendas.map(venda => {
                        faturamento_bar += parseFloat(venda.VALOR_TOTAL)

                        venda.venda_items.map(item => vendas.push(item))
                    })
                ))

                let itens_vendidos = vendas.reduce((prev, next) => (
                    prev + parseFloat(next.QUANTIDADE)
                ), 0)

                return {
                    info_geral_bar: {
                        qtde_caixas,
                        itens_vendidos,
                        faturamento_bar
                    }
                }
            })
        ]

        return await Promise.all(promises).then(result => {
            // Situação do evento
            const {
                inicio_venda,
                status_venda,
                inicio_evento,
                since_start
            } = result.find(a => !!a?.since_start)

            // Faturamentos
            const {
                faturamentos
            } = result.find(a => !!a.faturamentos)

            const {
                // Ingressos Emitidos
                vendido_hoje,
                vendido_total,
                cortesias_pdv_hoje,
                cortesias_pdv_total,
                total_vendido_hoje,
                total_vendido,
    
                receitas_total,
    
                // Ticket Médio
                ticket_medio
            } = result.find(a => !!a?.ticket_medio)

            // Info Geral Bar
            const {
                info_geral_bar
            } = result.find(a => !!a.info_geral_bar)

            // Info Geral Bar
            info_geral_bar.faturamento = info_geral_bar.faturamento_bar + Shared.moneyToFloat(faturamentos.site.total)
            + Shared.moneyToFloat(faturamentos.pdv.total)

            info_geral_bar.ticket_medio_bar = info_geral_bar.faturamento_bar / info_geral_bar.itens_vendidos
            info_geral_bar.ticket_medio_bar = !!info_geral_bar.ticket_medio_bar ? info_geral_bar.ticket_medio_bar : 0
            info_geral_bar.ticket_medio = info_geral_bar.faturamento / total_vendido

            info_geral_bar.faturamento_bar = Shared.moneyFormat(info_geral_bar.faturamento_bar)
            info_geral_bar.ticket_medio_bar = Shared.moneyFormat(info_geral_bar.ticket_medio_bar)
            info_geral_bar.ticket_medio = Shared.moneyFormat(info_geral_bar.ticket_medio)
            info_geral_bar.faturamento = Shared.moneyFormat(info_geral_bar.faturamento)

            
            // Média diária
            const quant = Math.round(vendido_total / since_start)
            const valor = Shared.moneyFormat(Shared.moneyToFloat(receitas_total) / since_start)

            return {
                // Situação do evento
                situacao_do_evento: {
                    inicio_venda,
                    status_venda,
                    inicio_evento
                },
                // Ingressos Emitidos
                ingressos_emitidos: {
                    vendido_hoje,
                    vendido_total,
                    cortesias_pdv_hoje,
                    cortesias_pdv_total,
                    total_vendido_hoje,
                    total_vendido,
                },
                // Faturamentos
                faturamentos,
                // Ticket Médio
                ticket_medio,
                // Média diária
                media_diaria: {
                    quant,
                    valor
                },
                // Info Geral Bar
                info_geral_bar
            }
        })
    }

    /**
     * Retorna a lista das classes de ingressos do evento informado.
     * 
     * Se a classe fazer parte de uma categoria, se agrupa com tal categoria.
     * 
     * Se a classe possuir solidários ou meia entradas, agrupa todas as suas diferentes variações.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getClasses(evento) {
        // Lista dos solidários ativos
        const solidarios = await tbl_classes_ingressos.findAll({
            where: { cla_evento: evento },
            attributes: [],
            include: {
                model: tbl_classe_ingressos_solidario,
                required: true,
                attributes: ['cis_nome']
            }
        })
        .then(result => {
            
            return result.map(a => {
                return a.tbl_classe_ingressos_solidarios?.map(a => a.cis_nome)
            })
            .reduce((a, b) => a.concat(b), [])
        })

        // Obtêm as vendas do evento
        return await tbl_ingressos.findAll({
            where: {
                ing_evento: evento
            },

            attributes: [
                'ing_status',
                'ing_valor',
                'ing_meia',
                'ing_solidario'
            ],

            include: [
                // Classe do ingresso
                {
                    model: tbl_classes_ingressos,
                    attributes: ['cla_nome'],

                    // Categoria da classe
                    include: {
                        model: tbl_categorias_classes_ingressos,
                        attributes: ['cat_nome']
                    }
                },

                // Ingresso no site
                {
                    model: lltckt_order_product_barcode,
                    required: false,
                    attributes: ['barcode'],
                    include: {
                        model: lltckt_order_product,
                        required: true,
                        attributes: ['order_id'],
                        include: {
                            model: lltckt_order,
                            required: true,
                            attributes: ['order_status_id']
                        }
                    }
                }
            ]
        })
        .then(result => {
            // Lista das categorias/classes sem categoria
            let categorias = []

            result.map(ing => {
                // Auxiliar do status do ingresso no site
                let order_status = ing?.lltckt_order_product_barcode?.lltckt_order_product?.lltckt_order?.order_status_id

                // Ingresso vendido, não cancelado
                let vendido = !![1,2].find(a => a == ing.ing_status) && (!order_status || order_status === 5)

                // Valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Ingresso sendo cortesia
                let cortesia = valor == 0

                // Ingresso solidário existente
                let solidario = solidarios.find(a => a == ing?.ing_solidario)

                // Nome da classe (+ nome solidário, se houver)
                let classe_nome = (`${ing.tbl_classes_ingresso.cla_nome} ${solidario ?? ''}`).trim()


                // Procura pela categoria registrada
                let cat_index = categorias.findIndex(a => (
                    // Nome da categoria
                    a.categoria === ing.tbl_classes_ingresso.tbl_categorias_classes_ingresso?.cat_nome

                    // Nome de classe sem categoria
                    || a.categoria === ing.tbl_classes_ingresso.cla_nome
                ))

                // Categoria encontrada
                if(cat_index >= 0) {
                    // Procura pela classe registrada
                    let classe_index = categorias[cat_index].classes.findIndex(a => (
                        a.classe === classe_nome
                        && a.valor_ing === valor
                    ))

                    // Classe encotrada
                    if(classe_index >= 0) {
                        // Se o ingresso foi vendido, registra a venda na categoria e classe
                        if(vendido) {
                            categorias[cat_index].vendas_quant += Number(!cortesia)
                            categorias[cat_index].cortesias_quant += Number(cortesia)
                            categorias[cat_index].total_quant++
                            categorias[cat_index].valor_total += valor
                            
                            categorias[cat_index].classes[classe_index].vendas_quant += Number(!cortesia)
                            categorias[cat_index].classes[classe_index].cortesias_quant += Number(cortesia)
                            categorias[cat_index].classes[classe_index].total_quant++
                            categorias[cat_index].classes[classe_index].valor_total += valor
                        }
                    }

                    // Classe não encontrada
                    else {
                        // Se o ingresso foi vendido, registra a venda na categoria e classe
                        if(vendido) {
                            categorias[cat_index].vendas_quant += Number(!cortesia)
                            categorias[cat_index].cortesias_quant += Number(cortesia)
                            categorias[cat_index].total_quant++
                            categorias[cat_index].valor_total += valor
                            
                            // Registra a nova classe
                            categorias[cat_index].classes.push({
                                classe: classe_nome,
                                valor_ing: valor,
                                vendas_quant: Number(!cortesia),
                                cortesias_quant: Number(cortesia),
                                total_quant: 1,
                                valor_total: valor
                            })
                        }

                        // Se o ingresso foi cancelado, registra a classe sem a venda
                        else {
                            categorias[cat_index].classes.push({
                                classe: classe_nome,
                                valor_ing: valor,
                                vendas_quant: 0,
                                cortesias_quant: 0,
                                total_quant: 0,
                                valor_total: 0
                            })
                        }
                    }
                }
                
                // Categoria não encontrada
                else {
                    // Nome da categoria ou da classe sem categoria
                    let cat_nome = ing.tbl_classes_ingresso.tbl_categorias_classes_ingresso?.cat_nome
                        ?? ing.tbl_classes_ingresso.cla_nome
                    
                    // Se o ingresso foi vendido, registra a venda na categoria e classe
                    if(vendido) {
                        categorias.push({
                            categoria: cat_nome,
                            vendas_quant: Number(!cortesia),
                            cortesias_quant: Number(cortesia),
                            total_quant: 1,
                            valor_total: valor,
                            classes: [{
                                classe: classe_nome,
                                valor_ing: valor,
                                vendas_quant: Number(!cortesia),
                                cortesias_quant: Number(cortesia),
                                total_quant: 1,
                                valor_total: valor
                            }]
                        })
                    }

                    // Se o ingresso foi cancelado, registra a categoria e classe sem a venda
                    else {
                        categorias.push({
                            categoria: cat_nome,
                            vendas_quant: 0,
                            cortesias_quant: 0,
                            total_quant: 0,
                            valor_total: 0,
                            classes: [{
                                classe: classe_nome,
                                valor_ing: valor,
                                vendas_quant: 0,
                                cortesias_quant: 0,
                                total_quant: 0,
                                valor_total: 0
                            }]
                        })
                    }
                }
            })

            // Ordena as categorias
            categorias.sort((a, b) => a.categoria.localeCompare(b.categoria))

            // Retorna as categorias/classes sem categoria
            return categorias
        })
    }

    /**
     * Retorna o relatório detalhado
     * dos ingressos emitidos no evento.
     * 
     * Pode-se aplicar:
     * - Busca direta, por PDV, POS ou código de barras;
     * - Filtros debusca;
     * - Paginação.
     * 
     * @param {number} evento Id do evento
     * @param {{
     *  pdv: string?,
     *  pos: string?,
     *  situacao: string?,
     *  tipo: string?,
     *  data_inicio: Date?,
     *  data_fim: Date?
     * }?} filtros Filtros de busca
     * @param {string?} busca 
     * @param {string?} linhas N° de linhas por página
     * @param {string?} pagina Página da lista
     * @returns 
     */
    static async getDetalhados(evento, filtros, busca, linhas, pagina) {

        // Obtêm os ingresso
        let ingressos = await this.getIngressosDetalhados(evento)

        // Busca - início

        /*
            Efetua a busca por:
            - PDV;
            - POS;
            - ou por Código de barras do ingresso.
        */
        if(busca) {
            let find_aux = busca.trim().toUpperCase()
            ingressos = ingressos.filter(a => (
                a.pdv.toUpperCase().includes(find_aux) ||
                `${a.pos}`.includes(find_aux) ||
                `${a.cod_barras}`.includes(find_aux)
            ))
        }

        // Busca - fim


        // Filtros - início

        /*
            Aplica os filtros.
            Quando a `busca` é informada, ignora os filtros.
        */
        if(filtros && !busca) {
            // Filtro por PDVs
            if(!!filtros.pdv) {
                ingressos = ingressos.filter(a => (
                    a.pdv === filtros.pdv
                ))
            }

            // Filtro por POS
            if(!!filtros.pos) {
                ingressos = ingressos.filter(a => (
                    a.pos === filtros.pos
                ))
            }

            // Filtro por Situação/status
            if(!!filtros.situacao) {
                ingressos = ingressos.filter(a => (
                    a.situacao === filtros.situacao
                ))
            }

            // Filtro por tipo/classe de ingresso
            if(!!filtros.tipo) {
                ingressos = ingressos.filter(a => (
                    a.ing === filtros.tipo
                ))
            }

            // Filtro por data de início
            if(!!filtros.data_inicio) {
                ingressos = ingressos.filter(a => (
                    new Date(a.data_compra) >= new Date(filtros.data_inicio)
                ))
            }

            // Filtro por data de fim
            if(!!filtros.data_fim) {
                ingressos = ingressos.filter(a => (
                    new Date(a.data_compra) <= new Date(filtros.data_fim)
                ))
            }
        }

        // Filtros - fim


        // Total de ingressos retornados
        const count = ingressos.length


        // Paginação - início

        // Converte as linhas e páginas em inteiros
        let l_int = parseInt(linhas)
        let p_int = parseInt(pagina)

        // Indicador de com ou sem paginação
        const with_pages = !isNaN(l_int) && !isNaN(p_int)
        
        // Página atual
        let page = undefined

        // Total de páginas
        let total = undefined
        
        // Paginação
        if(with_pages) {
            page = Math.abs(p_int)
            total = Math.ceil(count / l_int)
            ingressos = ingressos.slice((page -1) * l_int, page * l_int)
        }

        // Paginação - fim


        // Retorna os dados
        return {
            pagina: page,
            total,
            count,
            data: ingressos
        }
    }

    /**
     * Retorna o relatório detalhado
     * dos ingressos emitidos no evento.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getIngressosDetalhados(evento) {

        /**
         * Renomeia a forma de pagamento.
         * 
         * @param {string} nome Forma de pagamento
         * @param {number} valor Valor do ingresso
         * @returns 
         */
        const rename_mpgto = (nome, valor) => {
            // Ingressos sem valor são considerados como cortesias
            if(valor == 0)
                return 'CORTESIA'

            // Alinha as formas de pagamento do site com as dos PDVs
            switch (nome) {
                case 'CREDITO':
                case 'PagSeguro':
                    return 'CARTÃO DE CRÉDITO'
                
                case 'DEBITO':
                    return 'DÉBITO'
            
                default:
                    return nome
            }
        }

        // Retorna todas as vendas de ingressos do evento
        return await tbl_ingressos.findAll({
            where: { ing_evento: evento },
            attributes: [
                'ing_data_compra',
                'ing_pdv',
                'ing_pos',
                'ing_cod_barras',
                'ing_status',
                'ing_classe_ingresso',
                'cln_cod',
                'ing_valor',
                'ing_mpgto'
            ],
            order: [['ing_data_compra', 'DESC']],
            include: [
                // PDV
                {
                    model: tbl_pdvs,
                    attributes: [ 'pdv_nome' ]
                },

                // Classe do ingresso
                {
                    model: tbl_classes_ingressos,
                    attributes: [ 'cla_nome' ]
                },

                // Classe do ingresso numerado
                {
                    model: tbl_classe_numeracao,
                    attributes: [ 'cln_num' ]
                },

                // Forma de pagamento (PDVs)
                tbl_meio_pgto,

                // Dados de venda pelos PDVs
                {
                    model: tbl_venda_ingressos,
                    attributes: ['vend_pagseguro_cod']
                },

                // Ingresso no site
                {
                    model: lltckt_order_product_barcode,
                    include: {
                        model: lltckt_order_product,
                        include: {
                            model: lltckt_order,
                            where: {
                                order_status_id: { $in: [ 1, 5, 6, 7, 21 ]}
                            },
                            attributes: [
                                'order_id',
                                'payment_method',
                                'order_status_id',
                                'date_added'
                            ]
                        }
                    }
                }
            ]
        })
        .then(data => (
            data.map(ing => {
                // Auxiliar do valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Ingresso vendido nos PDVs
                if(ing.ing_pos) {
                    return {
                        data_compra: ing.ing_data_compra,
                        pdv: ing.tbl_pdv.pdv_nome,
                        pos: ing.ing_pos,
                        pedido: '-',
                        cod_barras: ing.ing_cod_barras,
                        situacao: this.set_status(ing.ing_status, false),
                        ing: ing.tbl_classes_ingresso.cla_nome,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(ing.tbl_meio_pgto.mpg_nome, valor),
                        cod_pagseguro: ing?.tbl_venda_ingresso?.vend_pagseguro_cod ?? '-'
                    }
                }

                // Ingresso vendido no site
                else {
                    // Auxiliar do ingresso no site
                    let order = ing.lltckt_order_product_barcode.lltckt_order_product.lltckt_order

                    return {
                        data_compra: ing.ing_data_compra,
                        pdv: 'Quero Ingresso - Internet',
                        pos: null,
                        pedido: order.order_id,
                        cod_barras: ing.ing_cod_barras,
                        situacao: this.set_status(order.order_status_id, true),
                        ing: ing.tbl_classes_ingresso.cla_nome,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(order.payment_method, valor),
                        cod_pagseguro: ing?.tbl_venda_ingresso?.vend_pagseguro_cod ?? '-'
                    }
                }
            })
        ))
    }

    /**
     * Retorna os filtros do relatório detalhado.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getDetalhadosFilter(evento) {

        // Obtêm os dados em paralélo
        const promises = [
            // PDVs e POS
            await tbl_ingressos.findAll({
                where: { ing_evento: evento },
                attributes: [ 'ing_pos' ],
                include: {
                    model: tbl_pdvs,
                    attributes: [ 'pdv_nome' ]
                }
            })
            .then(result => {
                let pdv = []  // Lista dos PDVs
                let pos = []  // Lista dos POS
    
                result.map(ing => {
                    // Adiciona na lista os PDVs
                    if(!pdv.find(a => a === ing.tbl_pdv?.pdv_nome)) {
                        pdv.push(ing.tbl_pdv?.pdv_nome)
                    }
    
                    // Adiciona na lista os POS
                    if(!pos.find(a => a === ing.ing_pos)) {
                        pos.push(ing.ing_pos)
                    }
                })
    
                // Filtra os resultados vazios
                pdv = pdv.filter(a => !!a)
                pos = pos.filter(a => !!a)
    
                // Adiciona nos PDVs as vendas pelo site
                pdv.unshift('Quero Ingresso - Internet')
    
                return { pdv, pos }
            }),

            // Tipo/classe de ingresso
            await tbl_classes_ingressos.findAll({
                where: { cla_evento: evento },
                attributes: [ 'cla_nome' ]
            })
            .then(result => ({
                // Lista das classes de ingresso
                tipo: result.map(a => a.cla_nome)
            }))
        ]

        // Situação/status dos ingressos
        const situacao = [
            'AGUARD. PAGAMENTO',
            'APROVADO',
            'ESTORNADO',
            'NÃO APROVADO',
            'AGUARD. PIX',
            '-'
        ]

        // Retorna os dados após terminar as promises
        return await Promise.all(promises).then(result => {
            const {
                pdv, pos
            } = result.find(a => !a.tipo)

            const {
                tipo
            } = result.find(a => !!a.tipo)

            return {
                pdv,
                pos,
                situacao,
                tipo
            }
        })
    }

}