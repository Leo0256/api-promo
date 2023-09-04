import schemas from '../schemas/index.js'
import Shared from './shared.js'

const {
    tbl_ingressos,
    tbl_classes_ingressos,
    tbl_categorias_classes_ingressos,
    tbl_itens_classes_ingressos,
    tbl_pdvs,
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

        const {
            // Quantidade de ingressos vendidos
            vendas,

            // Quantidade de cortesias
            cortesias
        } = await tbl_ingressos.findAll({
            where: {
                ing_evento: evento,
                ing_status: [ 1, 2 ]
            },
            attributes: [
                'ing_valor',
                'ing_pdv'
            ],
            include: {
                model: lltckt_order_product_barcode,
                include: {
                    model: lltckt_order_product,
                    required: true,
                    attributes: [ 'total' ],
                    include: {
                        model: lltckt_order,
                        required: true,
                        where: { order_status_id: 5 },
                        attributes: [ 'order_status_id' ]
                    }
                }
            }
        })
        .then(data => {
            // Filtra pelos ingressos vendidos
            const ingressos = data.filter(b => (
                !!b.ing_pdv || !!b.lltckt_order_product_barcode
            ))

            // Quantidade de ingressos vendidos
            let vendas = 0

            // Quantidade de cortesias
            let cortesias = 0

            ingressos.map(ing => {
                // Auxiliar do ingresso no site
                let aux = ing.lltckt_order_product_barcode?.lltckt_order_product

                // Ingresso vendido
                if(
                    parseFloat(ing.ing_valor) != 0 ??
                    parseFloat(aux?.total ?? 1) != 0
                ) {
                    vendas++
                }

                // Cortesia
                else cortesias++
            })

            return {
                vendas,
                cortesias
            }
        })

        // Total de ingressos + cortesias
        const total = vendas + cortesias

        // Percentuais dos valores
        let vendas_perc = Math.round(vendas / total * 100)
        let cortesias_perc = Math.round(cortesias / total * 100)

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
                        ing_status: [ 1, 2 ]
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

            // Retorna os dados das classes
            return data
        })
    }

    /**
     * Retorna os dados do gráfico de barras "Vendas por Lote",
     * tela de venda geral.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getLotes(evento) {
        // Obtêm os ingressos vendidos do evento
        return await tbl_ingressos.findAll({
            where: {
                ing_evento: evento,
                ing_status: [ 1, 2 ]
            },
            attributes: [
                'ing_valor',
                'ing_pdv'
            ],
            include: [
                // Lote
                {
                    model: tbl_itens_classes_ingressos,
                    attributes: [ 'itc_prioridade' ]
                },

                // Ingresso no site
                {
                    model: lltckt_order_product_barcode,
                    include: {
                        model: lltckt_order_product,
                        attributes: [
                            'total',
                            'quantity'
                        ],
                        required: true,
                        include: {
                            model: lltckt_order,
                            where: { order_status_id: 5 },
                            required: true,
                            attributes: [ 'order_id' ]
                        }
                    }
                }
            ]
        })
        .then(data => {
            // Filtra pelos ingressos vendidos
            const ingressos = data.filter(b => (
                !!b.ing_pdv || !!b.lltckt_order_product_barcode
            ))

            // Lista das vendas dos lotes
            let lotes = []

            ingressos.map(ing => {
                // N° do Lote
                let lote = ing.tbl_itens_classes_ingresso.itc_prioridade

                // Valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Verifica se o lote já está na lista
                let index = lotes.findIndex(a => a.lote === lote)

                // Se o lote estiver na lista, atualiza seus dados
                if(index >= 0) {
                    lotes[index].valor += valor
                    lotes[index].quant++
                }

                // Se o lote não estiver na lista, faz o registro
                else {
                    lotes.push({
                        lote,
                        valor,
                        quant: 1
                    })
                }
            })

            // Ordena os lotes pela prioridade
            lotes.sort((a,b) => a.lote - b.lote)

            // Totaliza os valores dos lotes
            let total_valor = lotes.reduce((a, b) => a + b.valor, 0)
            let total_quant = lotes.reduce((a, b) => a + b.quant, 0)

            lotes.map(lote => {
                // Formata o n° do lote
                lote.lote = `${lote.lote}° Lote`

                // Formata o valor vendido do lote
                lote.valor = Shared.moneyFormat(lote.valor)

                // Calcula o % de venda do lote
                lote.perc = Math.round(lote.quant / total_quant * 100)
            })

            // Adiciona na lista a totalização dos valores dos lotes
            lotes.push({
                lote: 'Total',
                valor: Shared.moneyFormat(total_valor),
                quant: total_quant,
                perc: 100
            })

            // Retorna as vendas dos lotes
            return lotes
        })
    }

    /**
     * Retorna os dados da tabela "Ranking de Pdvs",
     * tela de venda geral.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getRankingPdvs(evento) {
        // Obtêm os ingressos vendidos do evento
        return await tbl_ingressos.findAll({
            where: { ing_evento: evento },
            attributes: [
                'ing_status',
                'ing_valor',
                'ing_pdv',
                'ing_data_compra'
            ],
            include: [
                // PDV
                {
                    model: tbl_pdvs,
                    attributes: [ 'pdv_nome' ]
                },

                // Ingresso no site
                {
                    model: lltckt_order_product_barcode,
                    include: {
                        model: lltckt_order_product,
                        attributes: [
                            'order_id'
                        ],
                        required: true,
                        include: {
                            model: lltckt_order,
                            required: true,
                            attributes: [ 'order_status_id' ]
                        }
                    }
                }
            ]
        })
        .then(data => {
            // Filtra pelos ingressos vendidos
            const ingressos = data.filter(b => (
                !!b.ing_pdv || !!b.lltckt_order_product_barcode
            ))

            // Lista dos PDVs
            let pdvs = []

            ingressos.map(ing => {
                // Nome do PDV
                let pdv = null
                if(!ing.ing_pdv) {
                    pdv = 'Quero Ingresso - Internet'
                }
                else {
                    pdv = ing.tbl_pdv.pdv_nome
                }

                // Valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Dia atual
                let date_today = new Date()
                date_today.setUTCHours(0,0,0,0)

                // Auxiliar do ingresso no site
                let site_aux = ing.lltckt_order_product_barcode?.lltckt_order_product?.lltckt_order

                // Indicador de ingresso vendido
                let vendido = !!site_aux
                    ? site_aux.order_status_id === 5 // Vendido no site
                    : !![1,2].find(a => a == ing.ing_status) // Vendido nos PDVs

                // Ingresso vendido hoje
                let hoje = date_today <= new Date(ing.ing_data_compra)

                // Verifica se o PDV está na lista
                let index = pdvs.findIndex(a => a.nome === pdv)

                // Se o PDV estiver na lista, atualiza seus dados
                if(index >= 0) {
                    // Se o ingresso foi vendido, contabiliza na lista
                    if(vendido) {
                        // Ingresso vendido hoje
                        if(hoje){
                            pdvs[index].quant_hoje++
                            pdvs[index].valor_hoje += valor
                        }

                        pdvs[index].quant++
                        pdvs[index].valor += valor
                    }
                }

                // Se o PDV não estiver na lista, faz o registro
                else {
                    let quant_site = 0
                    let valor_site = 0
                    let quant_site_hoje = 0
                    let valor_site_hoje = 0

                    // Se o ingresso foi vendido, contabiliza na lista
                    if(vendido) {
                        // Ingresso vendido hoje
                        if(hoje) {
                            quant_site_hoje++
                            valor_site_hoje += valor
                        }

                        quant_site++
                        valor_site += valor
                    }

                    pdvs.push({
                        nome: pdv,
                        quant: quant_site,
                        valor: valor_site,
                        quant_hoje: quant_site_hoje,
                        valor_hoje: valor_site_hoje
                    })
                }
            })

            // Totaliza os valores dos PDVs
            let total = pdvs.reduce((prev, next) => {
                prev.quant += next.quant
                prev.valor += next.valor
                prev.quant_hoje += next.quant_hoje
                prev.valor_hoje += next.valor_hoje

                return prev
            }, {
                quant: 0,
                valor: 0,
                quant_hoje: 0,
                valor_hoje: 0
            })

            pdvs.map(pdv => {
                // Formata o valor vendido do PDV
                pdv.valor = Shared.moneyFormat(pdv.valor)
                pdv.valor_hoje = Shared.moneyFormat(pdv.valor_hoje)

                // Calcula o % de venda do PDV
                pdv.perc = Math.round(pdv.quant / total.quant * 100)
            })
            
            // Formata o total vendido
            total.valor = Shared.moneyFormat(total.valor)
            total.valor_hoje = Shared.moneyFormat(total.valor_hoje)

            // Adiciona na lista a totalização dos valores dos PDVs
            pdvs.push({
                nome: 'Total',
                ...total,
                perc: 100
            })

            return pdvs
        })
    }

}