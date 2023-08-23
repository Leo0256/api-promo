import schemas from '../schemas/index.js'

const {
    tbl_ingressos,
} = schemas.ticketsl_promo

const {
    lltckt_order,
    lltckt_order_product,
} = schemas.ticketsl_loja

/**
 * Regras de negócio das Métricas e Gráficos
 */
export default class Metrics {

    /**
     * Retorna os dados do gráfico "Tipos de Ingressos",
     * tela de venda geral.
     * 
     * @param {number} evento Id do evento
     * @param {number} categoria Id do evento no site
     * @returns 
     */
    static async getTiposIngressos(evento, categoria) {
        // Quantidade de ingressos vendidos no site
        const vendas_site = await lltckt_order.findAll({
            where: {
                category_id: categoria,
                order_status_id: 5
            },
            attributes: [ 'category_id' ],
            include: {
                model: lltckt_order_product,
                where: {
                    total: { $not: 0 }
                },
                attributes: [ 'quantity' ]
            }
        })
        .then(result => (
            result.reduce((prev, next) => {
                let quant = next.getDataValue('lltckt_order_product').quantity
                return prev + quant
            }, 0)
        ))

        const {
            // Quantidade de ingressos vendidos nos PDVs
            vendas_pdv,

            // Total de cortesias
            cortesias
        } = await tbl_ingressos.findAll({
            where: {
                ing_evento: evento,
                ing_pdv: { $not: null },
                ing_status: { $in: [ 1, 2 ] }
            },
            attributes: [ 'ing_valor' ]
        })
        .then(result => {
            let vendas_pdv = result.filter(a => (
                parseFloat(a.getDataValue('ing_valor')) != 0
            )).length

            let cortesias = result.filter(a => (
                parseFloat(a.getDataValue('ing_valor')) == 0
            )).length

            return {
                vendas_pdv,
                cortesias
            }
        })

        // Total de ingressos vendidos
        const vendas = vendas_pdv + vendas_site

        // Total de ingressos + cortesias
        const total = vendas + cortesias

        // Percentuais dos valores
        let vendas_perc = (vendas / total * 100).toFixed(0)
        let cortesias_perc = (cortesias / total * 100).toFixed(0)

        return {
            vendas,
            vendas_perc,
            cortesias,
            cortesias_perc,
            total
        }
    }

}