import schemas from '../schemas/index.js'
import Shared from './shared.js'

const {
    tbl_eventos,
    tbl_ingressos,
    caixa,
    venda,
    venda_item,
} = schemas.ticketsl_promo

const {
    lltckt_category_to_promoter,
    lltckt_category,
    lltckt_eve_categorias,
    lltckt_manufacturer,
    lltckt_order_product,
    lltckt_order,
    lltckt_product,
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

}