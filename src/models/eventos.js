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
    tbl_classe_numeracao,
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
     * @returns 
     */
    static async getEventos(user_id, evento) {
        // Obtêm os ids dos eventos e suas categorias
        const eventos = await lltckt_category_to_promoter.findAll({
            where: { id_promoter: user_id },
            attributes: [ 'id_Category' ]
        })
        .then(async result => {
            // Auxiliar das categorias
            let categorias = result.map(a => (
                a.getDataValue('id_Category')
            ))
            
            // Retorna os ids
            return await lltckt_eve_categorias.findAll({
                where: {
                    codCatSite: {
                        $in: categorias
                    },
                    codEvePdv: !!evento ? evento : { $not: null }
                },
                attributes: [
                    'codCatSite'
                ],
                include: [
                    {
                        model: tbl_eventos,
                        required: false,
                        attributes: [
                            'eve_cod',
                            'eve_nome',
                            'eve_data'
                        ]
                    },
                    {
                        model: lltckt_category,
                        attributes: [
                            'local',
                            'local2'
                        ]
                    }
                ]
            })
            .then(result => (
                result.map(a => {
                    // Dados do evento
                    let evento = a.getDataValue('tbl_evento').dataValues

                    // Dados do local do evento
                    let category = a.getDataValue('lltckt_category').dataValues

                    // Data atual
                    let today = new Date()

                    // Data do evento
                    let date_aux = new Date(evento.eve_data)

                    // Formata a data do evento
                    evento.eve_data = Shared.getFullDate(date_aux)

                    // Status do início do evento
                    let inicio_evento
                    
                    // Calcula os dias até o início do evento
                    const days_to = Shared.calcDaysBetween(date_aux, today)
                    if(days_to > 0)
                        inicio_evento = `Faltam ${days_to.toLocaleString('pt-BR')} dias`
                    else if(days_to < 0)
                        inicio_evento = 'Encerrado'
                    else
                        inicio_evento = 'Hoje'

                    return ({
                        ...evento,
                        inicio_evento,
                        local: category.local2,
                        cidade: category.local,
                        categoria: a.getDataValue('codCatSite')
                    })
                })
            ))
        })

        // 00:00 hora do dia atual
        let datetime_inicial_hoje = new Date()
        datetime_inicial_hoje.setHours(0,0,0)

        // Calcula as vendas de cada evento
        const promises = eventos.map(async evento => {
            const {
                vendido_site_hoje,
                vendido_site_total,
                receitas_site_hoje,
                receitas_site_total,
                taxas_site_total
            } = await lltckt_order.findAll({
                where: {
                    category_id: evento.categoria,
                    order_status_id: 5
                },
                attributes: [
                    'category_id',
                    'date_added'
                ],
                include: {
                    model: lltckt_order_product,
                    where: {
                        total: { $not: 0 }
                    },
                    attributes: [
                        'quantity',
                        'total',
                        'tax'
                    ]
                }
            })
            .then(result => {
                // Quantidade vendida no site
                let vendido_site_hoje = 0   // Hoje
                let vendido_site_total = 0  // Total

                // Receitas obtidas no site
                let receitas_site_hoje = 0  // Hoje
                let receitas_site_total = 0 // Total

                // Total obtido em taxas no site
                let taxas_site_total = 0

                result.map(({ dataValues: venda }) => {
                    // Calcula as vendas do dia atual
                    if(venda.date_added >= datetime_inicial_hoje) {
                        vendido_site_hoje += venda.lltckt_order_product.quantity
                        receitas_site_hoje += parseFloat(venda.lltckt_order_product.total)
                    }

                    // Calcula as vendas totais
                    vendido_site_total += venda.lltckt_order_product.quantity
                    receitas_site_total += parseFloat(venda.lltckt_order_product.total)

                    // Calcula o total em taxas
                    taxas_site_total += parseFloat(venda.lltckt_order_product.tax)
                })

                return {
                    vendido_site_hoje,
                    vendido_site_total,
                    receitas_site_hoje,
                    receitas_site_total,
                    taxas_site_total
                }
            })

            const {
                vendido_pdv_hoje,
                vendido_pdv_total,
                cortesias_pdv_hoje,
                cortesias_pdv_total,
                receitas_pdv_hoje,
                receitas_pdv_total,
                taxas_pdv_total
            } = await tbl_ingressos.findAll({
                where: {
                    ing_evento: evento.eve_cod,
                    ing_pdv: { $not: null },
                    ing_status: { $in: [ 1, 2 ] }
                },
                attributes: [
                    'ing_data_compra',
                    'ing_valor',
                    'ing_taxa'
                ]
            })
            .then(result => {
                // Quantidade vendida nos PDVs
                let vendido_pdv_hoje = 0    // Hoje
                let vendido_pdv_total = 0   // Total

                // Total de Cortesias
                let cortesias_pdv_hoje = 0  // Hoje
                let cortesias_pdv_total = 0 // Total

                // Receitas obtidas nos PDVs
                let receitas_pdv_hoje = 0   // Hoje
                let receitas_pdv_total = 0  // Total

                // Total obtido em taxas nos PDVs
                let taxas_pdv_total = 0

                result.map(({ dataValues: ingresso }) => {
                    if(ingresso.ing_valor != 0) {
                        // Calcula as vendas do dia atual
                        if(ingresso.ing_data_compra >= datetime_inicial_hoje) {
                            vendido_pdv_hoje++
                            receitas_pdv_hoje += parseFloat(ingresso.ing_valor)
                        }

                        // Calcula as vendas totais
                        vendido_pdv_total++
                        receitas_pdv_total += parseFloat(ingresso.ing_valor)
                    }
                    else {
                        if(ingresso.ing_data_compra >= datetime_inicial_hoje) {
                            // Calcula as cortesias do dia atual
                            cortesias_pdv_hoje++
                        }

                        // Calcula o total de cortesias
                        cortesias_pdv_total++

                        // Calcula o total em taxas
                        taxas_pdv_total += parseFloat(ingresso.ing_taxa)
                    }
                })

                return {
                    vendido_pdv_hoje,
                    vendido_pdv_total,
                    cortesias_pdv_hoje,
                    cortesias_pdv_total,
                    receitas_pdv_hoje,
                    receitas_pdv_total,
                    taxas_pdv_total
                }
            })

            // Retorna os dados da vitrine de Eventos
            return {
                ...evento,
                vendido_hoje: vendido_pdv_hoje + vendido_site_hoje,
                vendido_total: vendido_pdv_total + vendido_site_total,
                cortesias_pdv_hoje,
                cortesias_pdv_total,
                receitas_hoje: Shared.moneyFormat(receitas_pdv_hoje + receitas_site_hoje),
                receitas_total: Shared.moneyFormat(receitas_pdv_total + receitas_site_total),
                taxas_total: Shared.moneyFormat(taxas_pdv_total + taxas_site_total)
            }
        })

        return await Promise.all(promises)
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
                                attributes: [ 'total' ]
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
            .then(result => {
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
            ingressos = ingressos.filter(a => (
                a.pdv === busca ||
                a.pos === busca ||
                a.cod_barras === busca
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
                        cod_barras: ing.ing_cod_barras,
                        situacao: this.set_status(ing.ing_status, false),
                        ing: ing.tbl_classes_ingresso.cla_nome,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(ing.tbl_meio_pgto.mpg_nome, valor)
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
                        cod_barras: ing.ing_cod_barras,
                        situacao: this.set_status(order.order_status_id, true),
                        ing: ing.tbl_classes_ingresso.cla_nome,
                        ing_num: ing.tbl_classe_numeracao?.cln_num ?? '-',
                        valor: Shared.moneyFormat(valor),
                        pagamento: rename_mpgto(order.payment_method, valor)
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