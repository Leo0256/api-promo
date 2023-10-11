import { col, where, Op } from 'sequelize'
import schemas from '../schemas/index.js'
import Shared from './shared.js'

const {
    tbl_eventos,
    tbl_ingressos,
    caixa,
    venda,
    venda_item,
    tbl_pdvs,
    tbl_classes_ingressos,
    tbl_classe_ingressos_solidario,
    tbl_categorias_classes_ingressos,
    tbl_classe_grupo,
    tbl_classe_numeracao,
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
                                let valor = order.lltckt_order_products.reduce((a, b) => a += parseFloat(b.total), 0)

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
                let order_status = ing?.lltckt_order_product_barcode?.lltckt_order_product[0]?.lltckt_order?.order_status_id

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
     * Retorna o relatório de vendas dos PDVs.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getPDVs(evento) {
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
                'ing_data_compra',
                'ing_mpgto',
                'ing_solidario'
            ],

            include: [
                // PDV
                {
                    model: tbl_pdvs,
                    attributes: ['pdv_nome']
                },

                // Classe do ingresso
                {
                    model: tbl_classes_ingressos,
                    attributes: ['cla_nome']
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
            let pdvs = []

            // 00:00 do dia atual
            let dia_hoje = new Date()
            dia_hoje.setUTCHours(0,0,0)

            result.map(ing => {
                // Auxiliar do status do ingresso no site
                let order_status = ing?.lltckt_order_product_barcode?.lltckt_order_product[0]?.lltckt_order?.order_status_id

                // Ingresso vendido, não cancelado
                let vendido = !![1,2].find(a => a == ing.ing_status) && (!order_status || order_status === 5)

                // Ingresso emitido hoje
                let emitido_hoje = ing.ing_data_compra >= dia_hoje

                // Valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Ingresso sendo cortesia
                let cortesia = valor == 0

                // Valor do ingresso emitido hoje
                let valor_hoje = emitido_hoje ? valor : 0

                // Ingresso solidário existente
                let solidario = solidarios.find(a => a == ing?.ing_solidario)

                // Nome do PDV
                let pdv_nome = ing?.tbl_pdv?.pdv_nome ?? 'Quero Ingresso - Internet'

                // Nome da classe (+ nome solidário, se houver)
                let classe_nome = (`${ing.tbl_classes_ingresso.cla_nome} ${solidario ?? ''}`).trim()

                // Procura pelo PDV registrado
                let pdv_index = pdvs.findIndex(a => a.pdv === pdv_nome)

                // PDV encontrado
                if(pdv_index >= 0) {
                    // Se o ingresso foi vendido, registra a venda no PDV
                    if(vendido) {
                        pdvs[pdv_index].quant_hoje += Number(emitido_hoje)
                        pdvs[pdv_index].valor_hoje += valor_hoje
                        pdvs[pdv_index].quant_total += Number(!cortesia)
                        pdvs[pdv_index].valor_total += valor
                        pdvs[pdv_index].cortesias += Number(cortesia)

                        switch(ing.ing_mpgto) {
                            // Dinheiro
                            case 1:
                                pdvs[pdv_index].meios_pgto.dinheiro += valor
                                break

                            // Crédito
                            case 2:
                                pdvs[pdv_index].meios_pgto.credito += valor
                                break

                            // Débito
                            case 3:
                                pdvs[pdv_index].meios_pgto.debito += valor
                                break

                            // PIX
                            case 4:
                                pdvs[pdv_index].meios_pgto.pix += valor
                                break
                            
                            default: break
                        }
                    }

                    // Procura pela classe registrada
                    let classe_index = pdvs[pdv_index].classes.findIndex(a => (
                        a.classe === classe_nome
                    ))

                    // Classe encontrada
                    if(classe_index >= 0) {
                        // Se o ingresso foi vendido, registra a venda na classe
                        if(vendido) {
                            pdvs[pdv_index].classes[classe_index].quant_hoje += Number(emitido_hoje)
                            pdvs[pdv_index].classes[classe_index].valor_hoje += valor_hoje
                            pdvs[pdv_index].classes[classe_index].quant_total += Number(!cortesia)
                            pdvs[pdv_index].classes[classe_index].valor_total += valor
                            pdvs[pdv_index].classes[classe_index].cortesias += Number(cortesia)
                        }
                    }

                    // Classe não encontrada
                    else {
                        // Se o ingresso foi vendido, registra a venda na classe
                        if(vendido) {
                            // Registra a nova classe
                            pdvs[pdv_index].classes.push({
                                classe: classe_nome,
                                quant_hoje: Number(emitido_hoje),
                                valor_hoje: valor_hoje,
                                quant_total: Number(!cortesia),
                                valor_total: valor,
                                cortesias: Number(cortesia)
                            })
                        }

                        // Se o ingresso foi cancelado, registra a classe sem a venda
                        else {
                            pdvs[pdv_index].classes.push({
                                classe: classe_nome,
                                quant_hoje: 0,
                                valor_hoje: 0,
                                quant_total: 0,
                                valor_total: 0,
                                cortesias: 0
                            })
                        }
                    }
                }

                // PDV não encontrado
                else {
                    // Se o ingresso foi vendido, registra a venda no PDV
                    if(vendido) {
                        let meios_pgto = {
                            dinheiro: 0,
                            credito: 0,
                            debito: 0,
                            pix: 0
                        }

                        switch(ing.ing_mpgto) {
                            // Dinheiro
                            case 1:
                                meios_pgto.dinheiro += valor
                                break

                            // Crédito
                            case 2:
                                meios_pgto.credito += valor
                                break

                            // Débito
                            case 3:
                                meios_pgto.debito += valor
                                break

                            // PIX
                            case 4:
                                meios_pgto.pix += valor
                                break
                            
                            default: break
                        }

                        pdvs.push({
                            pdv: pdv_nome,
                            quant_hoje: Number(emitido_hoje),
                            valor_hoje: valor_hoje,
                            quant_total: Number(!cortesia),
                            valor_total: valor,
                            cortesias: Number(cortesia),
                            meios_pgto,
                            classes: [{
                                classe: classe_nome,
                                quant_hoje: Number(emitido_hoje),
                                valor_hoje: valor_hoje,
                                quant_total: Number(!cortesia),
                                valor_total: valor,
                                cortesias: Number(cortesia)
                            }]
                        })
                    }
                }
            })

            // Ordena os PDVs
            pdvs.sort((a, b) => a.pdv.localeCompare(b.pdv))

            // Retorna os PDVs
            return pdvs
        })
    }

    /**
     * Retorna o relatório diário de vendas, podendo filtrar entre
     * as vendas: por classe, ou por PDV.
     * 
     * @param {number} evento Id do evento
     * @param {'classes'|'pdv'} filtro Filtro das vendas diárias
     */
    static async getDiarios(evento, filtro) {
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

        // Data do evento
        const data_evento = await tbl_eventos.findByPk(evento, {
            attributes: ['eve_data']
        })
        .then(result => new Date(result?.eve_data ?? Date.now()))

        // Obtêm as vendas do evento
        return await tbl_ingressos.findAll({
            where: {
                ing_evento: evento,

                // Filtro de ingressos não cancelados
                ing_status: [1, 2],
                $or: [
                    { ing_pdv: { $not: null }},
                    where(col('lltckt_order_product_barcode.barcode'), Op.not, null)
                ]
            },

            attributes: [
                'ing_status',
                'ing_valor',
                'ing_data_compra',
                'ing_solidario'
            ],

            // Ordena pela data mais recente
            order: [['ing_data_compra', 'desc']],

            include: [
                // PDV
                {
                    model: tbl_pdvs,
                    attributes: ['pdv_nome']
                },

                // Classe do ingresso
                {
                    model: tbl_classes_ingressos,
                    attributes: ['cla_nome']
                },

                // Ingresso no site
                {
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
            ]
        })
        .then(result => {
            let diarios = []

            result.map(ing => {
                // Valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Ingresso sendo cortesia
                let cortesia = valor == 0

                // Classe/PDV da venda
                let nome_venda

                // Define a orientação da venda: por classes, ou por PDVs
                switch (filtro) {
                    case 'classes':
                        // Ingresso solidário existente
                        let solidario = solidarios.find(a => a == ing?.ing_solidario)

                        // Nome da classe (+ nome solidário, se houver)
                        nome_venda = (`${ing.tbl_classes_ingresso.cla_nome} ${solidario ?? ''}`).trim()

                        break

                    case 'pdvs':
                        // Nome do PDV
                        nome_venda = ing?.tbl_pdv?.pdv_nome ?? 'Quero Ingresso - Internet'
                        
                        break
                
                    default: break
                }

                // Data da venda
                let data_venda = `${Shared.getFullDate(ing.ing_data_compra)} - `
                    + `${Shared.getWeekday(ing.ing_data_compra)}`
                
                
                // Procura pela data registrada
                let date_index = diarios.findIndex(a => (
                    a.data === data_venda
                ))

                // Data encontrada
                if(date_index >= 0) {
                    diarios[date_index].vendidos += Number(!cortesia)
                    diarios[date_index].cortesias += Number(cortesia)
                    diarios[date_index].valor += valor

                    // Procura pela venda registrada
                    let venda_index = diarios[date_index].vendas.findIndex(a => (
                        a.nome == nome_venda
                    ))

                    // Venda encontrada
                    if(venda_index >= 0) {
                        diarios[date_index].vendas[venda_index].vendidos += Number(!cortesia)
                        diarios[date_index].vendas[venda_index].cortesias += Number(cortesia)
                        diarios[date_index].vendas[venda_index].valor += valor
                    }

                    // Venda não encontrada
                    else {
                        // Registra a nova venda
                        diarios[date_index].vendas.push({
                            nome: nome_venda,
                            vendidos: Number(!cortesia),
                            cortesias: Number(cortesia),
                            valor
                        })
                    }
                }

                // Data não encontrada
                else {
                    // Prazo até a data do evento
                    let prazo = Shared.calcDaysBetween(data_evento, ing.ing_data_compra)

                    diarios.push({
                        data: data_venda,
                        prazo: `${prazo} dia${prazo > 1 ? 's' : ''}`,
                        vendidos: Number(!cortesia),
                        cortesias: Number(cortesia),
                        valor,
                        vendas: [{
                            nome: nome_venda,
                            vendidos: Number(!cortesia),
                            cortesias: Number(cortesia),
                            valor
                        }]
                    })
                }
            })

            // Retorna o relatório diário
            return diarios
        })
    }

    /**
     * Retorna o relatório de classes numeradas.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getNumerados(evento) {

        /**
         * Define a disponibilidade do numerado.
         * 
         * @param {number} disp 
         * @returns 
         */
        const setDisp = disp => {
            switch (disp) {
                case 0: return 'Indisponível'
                case 1: return 'Disponível'
                case 2: return 'Parcial'
            
                default: break
            }
        }

        // Obtêm as classes numeradas do evento
        return await tbl_classes_ingressos.findAll({
            where: {
                cla_evento: evento,
                cla_numeracao: 1
            },
            attributes: ['cla_nome'],
            include: {
                model: tbl_classe_grupo,
                required: true,
                separate: true,
                attributes: ['clg_nome'],
                include: {
                    model: tbl_classe_numeracao,
                    as: 'numerados',
                    attributes: [
                        'cln_disp',
                        'cln_texto_pos',
                        'cln_cortesia'
                    ],
                    order: [['cln_cod', 'asc']],
                    include: {
                        model: tbl_ingressos,
                        separate: true,
                        where: {
                            // Filtro de ingressos não cancelados
                            ing_status: [1, 2],
                            $or: [
                                { ing_pdv: { $not: null }},
                                where(col('lltckt_order_product_barcode.barcode'), Op.not, null)
                            ]
                        },
                        attributes: [
                            'ing_cod_barras',
                            'ing_valor',
                            'ing_meia'
                        ],
                        include: [
                            // PDV
                            {
                                model: tbl_pdvs,
                                attributes: ['pdv_nome']
                            },

                            // Ingresso no site
                            {
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
                        ]
                    }
                }
            }
        })
        .then(result => {
            let classes = []

            result.map(classe => {
                // Auxiliar dos grupos de numerados
                let grupos = []

                // Registra os grupos de numerados
                classe.tbl_classe_grupos.map(grupo => {
                    // Auxiliar dos numerados
                    let numerados = []

                    // Registra os numerados
                    grupo.numerados.map(numerado => {
                        // Ingresso do numerado
                        let ingresso = numerado.tbl_ingressos[0]

                        // Numerado vendido
                        let vendidos = numerado.tbl_ingressos.length

                        // Valor do ingresso vendido
                        let valor = parseFloat(ingresso?.ing_valor ?? 0)

                        // Tipo e PDV do ingresso
                        let tipo = 'Inteira'
                        let pdv = '-'

                        // Se o numerado foi vendido
                        if(ingresso) {
                            // Redefine o tipo de ingresso
                            if(valor == 0) tipo = 'Cortesia'
                            else if(ingresso.ing_meia) tipo = 'Meia'

                            // Obtêm o nome do PDV
                            pdv = ingresso?.tbl_pdv?.pdv_nome ?? 'Quero Ingresso - Internet'
                        }

                        // Registra o numerado
                        numerados.push({
                            numerado: numerado.cln_texto_pos,
                            disp: setDisp(numerado.cln_disp),
                            vendido: !!vendidos,
                            cod_barras: ingresso?.ing_cod_barras ?? '-',
                            quant_vendido: vendidos,
                            valor_venda: Shared.moneyFormat(valor),
                            tipo,
                            pdv
                        })
                    })

                    // Verifica a disponibilidade do grupo
                    let disp_total = numerados.reduce((a, b) => a += Number(b.disp === 'Disponível'), 0)
                    let disp = disp_total === 0 ? 0
                        : disp_total === numerados.length ? 1
                        : 2
                    
                    // Calcula o total de numerados vendidos e disponíveis
                    let vendidos = numerados.reduce((a, b) => a += Number(b.vendido), 0)
                    let saldo = numerados.length - vendidos

                    // Registra o grupo de numerados
                    grupos.push({
                        grupo: grupo.clg_nome,
                        disp: setDisp(disp),
                        estq_inicial: numerados.length,
                        vendidos,
                        vendidos_perc: Shared.percentage(vendidos, numerados.length),
                        saldo,
                        saldo_perc: Shared.percentage(saldo, numerados.length),
                        numerados
                    })
                })

                // Verifica a diponibilidade da classe numerada
                let disp_total = grupos.reduce((a, b) => a += Number(b.disp === 'Disponível'), 0)
                let disp = disp_total === 0 ? 0
                    : disp_total === grupos.length ? 1
                    : 2
                
                // Calcula o estoque de numerados da classe
                let estoque = grupos.reduce((a, b) => a += b.estq_inicial, 0)

                // Calcula o total de numerados vendidos e disponíveis
                let vendidos = grupos.reduce((a, b) => a += b.vendidos, 0)
                let saldo = estoque - vendidos

                // Registra a classe de numerados
                classes.push({
                    classe: classe.cla_nome,
                    disp: setDisp(disp),
                    estq_inicial: estoque,
                    vendidos,
                    vendidos_perc: Shared.percentage(vendidos, estoque),
                    saldo,
                    saldo_perc: Shared.percentage(saldo, estoque),
                    grupos
                })
            })

            // Retorna o relatório de numerados
            return classes
        })
    }

}