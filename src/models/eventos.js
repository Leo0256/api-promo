import schemas from '../schemas/index.js'

const {
    tbl_eventos,
    tbl_ingressos,
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
     * Converte valores numéricos no formato
     * monetário brasileiro.
     * 
     * @param {string|number} value 
     * @returns 
     */
    static moneyFormat(value) {
        return (Number(value ?? 0)).toLocaleString(
            'pt-BR', 
            {currency: 'BRL', style: 'currency'}
        )
    }

    /**
     * Retorna a lista dos Eventos do Promotor
     * na tela home.
     * 
     * @param {number} user_id Id do Promotor
     * @returns 
     */
    static async getEventos(user_id) {
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
                    }
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
            .then(result => {
                console.log(result)
                return result.map(a => {
                    // Dados do evento
                    let evento = a.getDataValue('tbl_evento').dataValues

                    // Dados do local do evento
                    let category = a.getDataValue('lltckt_category').dataValues


                    // Auxiliar no cálculo dos dias até o evento
                    const one_day = 24 * 60 * 60 * 1000

                    // Data atual
                    let today = new Date()

                    // Data do evento
                    let date_aux = new Date(evento.eve_data)

                    // Formata a data do evento
                    evento.eve_data = date_aux.toLocaleString(
                        'pt-BR',
                        { timeZoneName: 'short' }
                    )
                    .split(' ')[0]

                    // Status do início do evento
                    let inicio_evento

                    // O evento é no mesmo dia de hoje?
                    if(date_aux.getTime() == today.getTime()) {
                        inicio_evento = 'Hoje'
                    }
                    else {
                        // Calcula os dias até o evento
                        let days_to = Math.ceil((date_aux - today) / one_day)
    
                        if(days_to > 0)
                            inicio_evento = `Faltam ${days_to} dias`
                        else
                            inicio_evento = 'Encerrado'
                    }

                    return ({
                        ...evento,
                        inicio_evento,
                        local: category.local2,
                        cidade: category.local,
                        categoria: a.getDataValue('codCatSite')
                    })
                })
            })
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
                receitas_site_total
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
                        'total'
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

                result.map(({ dataValues: venda }) => {
                    // Calcula as vendas do dia atual
                    if(venda.date_added >= datetime_inicial_hoje) {
                        vendido_site_hoje += venda.lltckt_order_product.quantity
                        receitas_site_hoje += parseFloat(venda.lltckt_order_product.total)
                    }

                    // Calcula as vendas totais
                    vendido_site_total += venda.lltckt_order_product.quantity
                    receitas_site_total += parseFloat(venda.lltckt_order_product.total)
                })

                return {
                    vendido_site_hoje,
                    vendido_site_total,
                    receitas_site_hoje,
                    receitas_site_total
                }
            })

            const {
                vendido_pdv_hoje,
                vendido_pdv_total,
                cortesias_pdv_total,
                receitas_pdv_hoje,
                receitas_pdv_total
            } = await tbl_ingressos.findAll({
                where: {
                    ing_evento: evento.eve_cod,
                    ing_pdv: { $not: null },
                    ing_status: { $in: [ 1, 2 ] }
                },
                attributes: [
                    'ing_data_compra',
                    'ing_valor'
                ]
            })
            .then(result => {
                // Quantidade vendida nos PDVs
                let vendido_pdv_hoje = 0    // Hoje
                let vendido_pdv_total = 0   // Atual

                // Total de Cortesias
                let cortesias_pdv_total = 0

                // Receitas obtidas nos PDVs
                let receitas_pdv_hoje = 0
                let receitas_pdv_total = 0

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
                        // Calcula o total de cortesias
                        cortesias_pdv_total++
                    }
                })

                return {
                    vendido_pdv_hoje,
                    vendido_pdv_total,
                    cortesias_pdv_total,
                    receitas_pdv_hoje,
                    receitas_pdv_total
                }
            })

            // Retorna os dados da vitrine de Eventos
            return {
                ...evento,
                vendido_hoje: vendido_pdv_hoje + vendido_site_hoje,
                vendido_total: vendido_pdv_total + vendido_site_total,
                cortesias_pdv_total,
                receitas_hoje: this.moneyFormat(receitas_pdv_hoje + receitas_site_hoje),
                receitas_total: this.moneyFormat(receitas_pdv_total + receitas_site_total)
            }
        })

        return await Promise.all(promises)
    }
}