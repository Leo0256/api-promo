import schemas from '../schemas/index.js'
import Shared from './shared.js'

const {
    tbl_ingressos,
    tbl_classes_ingressos,
    tbl_categorias_classes_ingressos,
} = schemas.ticketsl_promo

const {
    lltckt_order,
    lltckt_product,
    lltckt_order_product,
    lltckt_order_product_barcode,
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
                attributes: [ 'quantity' ],
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
        let vendas_perc = parseInt((vendas / total * 100).toFixed(0))
        let cortesias_perc = parseInt((cortesias / total * 100).toFixed(0))

        return {
            vendas,
            vendas_perc,
            cortesias,
            cortesias_perc,
            total
        }
    }

    /**
     * Retorna os dados do gráfico de barras "Classes",
     * tela de venda geral.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getClasses(evento) {
        return await tbl_classes_ingressos.findAll({
            where: { cla_evento: evento },
            attributes: [
                'cla_cod',
                'cla_nome'
            ],
            include: [
                {
                    model: tbl_categorias_classes_ingressos,
                    attributes: [ 'cat_nome' ]
                },
                {
                    model: tbl_ingressos,
                    where: {
                        ing_pdv: { $not: null },
                        ing_status: { $in: [ 1, 2 ] }
                    },
                    required: false,
                    separate: true,
                    attributes: [
                        'ing_cod_barras',
                        'ing_valor'
                    ]
                },
                {
                    model: lltckt_product,
                    required: false,
                    separate: true,
                    attributes: [ 'product_id' ],
                    include: {
                        model: lltckt_order_product,
                        required: true,
                        attributes: [
                            'order_id',
                            'quantity',
                            'total'
                        ],
                        include: [
                            {
                                model: lltckt_order,
                                attributes: ['order_id'],
                                where: { order_status_id: 5 }
                            },

                            /*
                                Algumas rows estão quebradas, sendo necessário um filtro forçado
                                entre as 'orders' com ligação com algum registro de ingressos
                                no schema 'ticketsl_promo'
                            */
                            {
                                model: lltckt_order_product_barcode,
                                required: true
                            }
                        ]
                    }
                }
            ]
        })
        .then(result => {
            const data = []

            result.map(({ dataValues: classe }) => {

                // PDVs - início
                // Quantidade vendida
                let pdv_quant = 0

                // Quantidade de cortesias
                let cortesias_quant = 0

                /*
                    Calcula o valor total das vendas,
                    a quantidade vendida e a quantidade de cortesias
                */
                let pdv_valor = classe.tbl_ingressos.reduce((prev, next) => {
                    let valor = parseFloat(next.ing_valor)

                    if(valor != 0) pdv_quant++
                    else cortesias_quant++

                    return prev + valor
                }, 0)
                // PDVs - fim


                // Site - início
                // Quantidade vendida
                let site_quant = 0

                /*
                    Calcula o valor total das vendas e
                    a quantidade vendida
                */
                let site_valor = classe.lltckt_products.reduce((prev, next) => (
                    prev + next.lltckt_order_products.reduce((prev, next) => {
                        site_quant += next.quantity
                        return prev + parseFloat(next.total)
                    }, 0)
                ), 0)
                // Site - fim

                // Nome da Classe/Categoria
                let nome = classe.tbl_categorias_classes_ingresso?.cat_nome ?? classe.cla_nome
                
                // Quantidade total de vendas: pdv + site
                let venda = pdv_quant + site_quant

                // Quantidade total de ingressos: venda + cortesias
                let total = venda + cortesias_quant

                // Valor total das vendas: pdv + site
                let valor = pdv_valor + site_valor

                data.push({
                    tipo: nome,
                    venda,
                    cortesia: cortesias_quant,
                    total,
                    valor
                })
            })

            // Totalização dos dados
            let venda = 0
            let cortesia = 0
            let total = 0
            let valor = 0

            data.map(item => {
                venda += item.venda
                cortesia += item.cortesia
                total += item.total
                valor += item.valor
            })

            data.map(item => {
                // Formata o valor
                item.valor = Shared.moneyFormat(item.valor)

                // Calcula o %
                item.perc = Math.round(item.total / total * 100)
            })

            // Adiciona a totalização dos dados
            data.push({
                tipo: 'Total',
                venda,
                cortesia,
                total,
                valor: Shared.moneyFormat(valor),
                perc: 100
            })

            return data
        })
    }

}