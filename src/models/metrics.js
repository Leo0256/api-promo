import { col, where, Op } from 'sequelize'
import schemas from '../schemas/index.js'
import Shared from './shared.js'

const {
    tbl_ingressos,
    tbl_classes_ingressos,
    tbl_categorias_classes_ingressos,
    tbl_itens_classes_ingressos,
    tbl_pdvs,
    tbl_eventos,
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
     * Retorna a lista dos ingressos emitidos do evento informado.
     * 
     * @param {number} evento Id do evento
     * @param {boolean} somente_vendidos Filtra por apenas os ingressos vendidos
     * @param {boolean?} sem_cortesias Remove as cortesias na busca
     * @returns 
     */
    static async getIngressos(evento, somente_vendidos, sem_cortesias) {
        // Filtro do ingressos vendidos
        const vendidos = {
            ing: {},
            order: {}
        }

        // Filtro das cortesias
        const cortesias = {
            ing: {},
            order: {}
        }

        // Define o filtro para somente os ingressos vendidos
        if(somente_vendidos) {
            vendidos.ing = { ing_status: [ 1, 2 ] }
            vendidos.order = { order_status_id: 5 }
        }

        // Define o filtro para remover as cortesias
        if(sem_cortesias) {
            cortesias.ing = { ing_valor: { $gt: 0 } }
            cortesias.order = { total: { $gt: 0 } }
        }

        // Retorna a lista dos ingressos
        return await tbl_ingressos.findAll({
            where: {
                ing_evento: evento,
                ...vendidos.ing,
                ...cortesias.ing
            },
            attributes: [
                'ing_status',
                'ing_mpgto',
                'ing_valor',
                'ing_pdv',
                'ing_data_compra'
            ],
            order: [['ing_data_compra', 'ASC']],
            include: [
                // PDV
                {
                    model: tbl_pdvs,
                    attributes: [ 'pdv_nome' ]
                },

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
                        required: true,
                        attributes: [
                            'total',
                            'quantity'
                        ],
                        include: {
                            model: lltckt_order,
                            required: true,
                            where: {
                                ...vendidos.order,
                                ...cortesias.order
                            },
                            attributes: [ 
                                'order_status_id',
                                'payment_method'
                            ]
                        }
                    }
                }
            ]
        })
    }

    /**
     * Retorna os dados do gráfico "Tipos de Ingressos",
     * tela de venda geral.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getTiposIngressos(evento) {
        const {
            // Quantidade de ingressos vendidos
            vendas,

            // Quantidade de cortesias
            cortesias
        } = await this.getIngressos(evento, true)
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
                        ing_status: [ 1, 2 ],
                        $or: [
                            { ing_pdv: { $not: null }},
                            where(col('lltckt_order_product_barcode.barcode'), Op.not, null)
                        ]
                    },
                    required: false,
                    separate: true,
                    attributes: [
                        'ing_cod_barras',
                        'ing_valor'
                    ],
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
                                where: { order_status_id: 5 },
                                attributes: []
                            }
                        }
                    }
                },
            ]
        })
        .then(result => {
            const data = []

            result.map(({ dataValues: classe }) => {
                // Quantidade total de vendas
                let venda = 0

                // Quantidade de cortesias
                let cortesias_quant = 0

                // Valor total das vendas
                let valor = classe.tbl_ingressos.reduce((prev, next) => {
                    let valor = parseFloat(next.ing_valor)

                    if(valor != 0) venda++
                    else cortesias_quant++

                    return prev + valor
                }, 0)

                // Quantidade total de ingressos: venda + cortesias
                let total = venda + cortesias_quant

                // Nome da Classe/Categoria
                let nome = classe.tbl_categorias_classes_ingresso?.cat_nome ?? classe.cla_nome

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
        return await this.getIngressos(evento, true)
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
        return await this.getIngressos(evento, false)
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

            // Organiza os PDVs pela porcentagem de vendas
            pdvs.sort((a, b) => b.perc - a.perc)
            
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

    /**
     * Retorna os dados do gráfico de barras "Faturamento por Meio de Pagamento",
     * tela de venda geral.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getFaturamento(evento) {
        // Obtêm os ingressos vendidos do evento
        return await this.getIngressos(evento, true)
        .then(data => {
            // Filtra pelos ingressos vendidos
            const ingressos = data.filter(b => (
                !!b.ing_pdv || !!b.lltckt_order_product_barcode
            ))

            let faturamentos = [
                {
                    aux: [1], // Auxiliar de pesquisa
                    nome: 'Dinheiro',
                    quant: 0,
                    valor: 0,
                    perc: 0
                },
                {
                    aux: ['PagSeguro',2], // Auxiliar de pesquisa
                    nome: 'Crédito',
                    quant: 0,
                    valor: 0,
                    perc: 0
                },
                {
                    aux: [3], // Auxiliar de pesquisa
                    nome: 'Débito',
                    quant: 0,
                    valor: 0,
                    perc: 0
                },
                {
                    aux: ['PIX'], // Auxiliar de pesquisa
                    nome: 'PIX',
                    quant: 0,
                    valor: 0,
                    perc: 0
                }
            ]

            ingressos.map(ing => {
                // Valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Auxiliar do ingresso no site
                let site_aux = ing.lltckt_order_product_barcode?.lltckt_order_product?.lltckt_order

                // Meio de pagamento
                let meio_pgto = !!site_aux
                    ? site_aux.payment_method
                    : ing.ing_mpgto
                
                // Procura pelo meio de pagamento
                let index = faturamentos.findIndex(a => a.aux.includes(meio_pgto))

                // Contabiliza a venda
                if(index >= 0) {
                    faturamentos[index].quant++
                    faturamentos[index].valor += valor
                }
            })

            // Totaliza as vendas
            let total = faturamentos.reduce((prev, next) => {
                prev.quant += next.quant
                prev.valor += next.valor

                // Remove as variáveis auxiliares
                delete next.aux

                return prev
            }, {
                nome: 'Total',
                quant: 0,
                valor: 0,
                perc: 100
            })

            faturamentos.map(fat => {
                // Formata o valor vendido
                fat.valor = Shared.moneyFormat(fat.valor)

                // Calcula o % de venda
                fat.perc = Math.round(fat.quant / total.quant * 100)
            })

            // Formata o total vendido
            total.valor = Shared.moneyFormat(total.valor)

            // Adiciona na lista a totalização dos valores
            faturamentos.push(total)

            return faturamentos
        })
    }

    /**
     * Retorna os dados do gráfico "Gráfico Periódico",
     * tela de venda geral.
     * 
     * @param {number} evento Id do evento
     * @returns 
     */
    static async getPeriodico(evento) {
        // Obtêm a data de início do evento
        const eve_inicio = await tbl_eventos.findByPk(evento, {
            attributes: [ 'eve_data' ]
        })
        .then(a => a?.eve_data)

        // Obtêm os ingressos vendidos do evento
        return await this.getIngressos(evento, true)
        .then(data => {
            // Filtra pelos ingressos vendidos
            const ingressos = data.filter(b => (
                !!b.ing_pdv || !!b.lltckt_order_product_barcode
            ))

            // Lista dos períodos
            let periodos = []

            ingressos.map(ing => {
                // Valor do ingresso
                let valor = parseFloat(ing.ing_valor)

                // Dias até a data do evento
                let dia = Shared.calcDaysBetween(eve_inicio, ing.ing_data_compra)

                // Verifica se o dia está na lista
                let index = periodos.findIndex(a => a.dia === dia)

                // Se o dia estiver na lista, atualiza seus dados
                if(index >= 0) {
                    // Venda sem valor == cortesia
                    if(valor !== 0) periodos[index].venda++
                    else periodos[index].cortesia++

                    periodos[index].valor += valor
                    periodos[index].total++
                }

                // Se o dia não estiver na lista, faz o registro
                else {
                    let venda = 0
                    let cortesia = 0

                    // Venda sem valor == cortesia
                    if(valor !== 0) venda++
                    else cortesia++

                    periodos.push({
                        dia,
                        venda,
                        cortesia,
                        valor,
                        total: venda + cortesia
                    })
                }
            })

            // Organiza os dados de acordo com as datas
            periodos.sort((a, b) => b.dia - a.dia)

            // Total acumulado de ingressos
            let acumulado_quant = 0 // Quantidade vendida
            let acumulado_valor = 0 // Valor faturado

            // Registra o acumulo
            periodos.map(periodo => {
                acumulado_quant += periodo.total
                acumulado_valor += periodo.valor

                periodo.acumulado_quant = acumulado_quant
                periodo.acumulado_valor = acumulado_valor
            })

            return periodos
        })
    }

    /**
     * Retorna os dados do gráfico "Horário x Canal de Venda",
     * tela de venda geral.
     * 
     * @param {number} evento 
     * @returns 
     */
    static async getHorarioVenda(evento) {
        // Obtêm os ingressos vendidos do evento
        return await this.getIngressos(evento, true, true)
        .then(data => {
            // Filtra pelos ingressos vendidos
            const ingressos = data.filter(b => (
                !!b.ing_pdv || !!b.lltckt_order_product_barcode
            ))

            // Lista dos horários
            let horarios = []

            ingressos.map(ing => {
                // Horário da venda
                let date_aux = new Date(ing.ing_data_compra)
                let horario = `${date_aux.getHours()}:00`

                // Verifica se o horário está na lista
                let index = horarios.findIndex(a => a.horario === horario)

                // Se o horário estiver na lista, atualiza seus dados
                if(index >= 0) {
                    // Venda pelo PDV
                    if(!!ing.ing_pdv)
                        horarios[index].pdv++

                    // Venda pelo site
                    else
                        horarios[index].web++
                }

                // Se o horário não estiver na lista, faz o registro
                else {
                    let pdv = 0
                    let web = 0

                    // Venda pelo PDV
                    if(!!ing.ing_pdv)
                        pdv++

                    // Venda pelo site
                    else
                        web++

                    horarios.push({
                        horario,
                        pdv, web
                    })
                }
            })

            // Organiza a lista pelos horários
            horarios.sort((a, b) => (
                parseInt(a.horario) - parseInt(b.horario)
            ))

            return horarios
        })
    }

}