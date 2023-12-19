import { cast, col } from 'sequelize'
import schemas from '../schemas/index.js'

const {
    tbl_classes_ingressos,
    tbl_itens_classes_ingressos,
    tbl_classe_ingressos_solidario,
    tbl_classe_numeracao,
} = schemas.ticketsl_promo

const {
    lltckt_product,
} = schemas.ticketsl_loja

export default class Shared {

    /**
     * Retorna o total de dias entre duas datas.
     * 
     * @param {Date} first Data inicial
     * @param {Date} end Data final
     * @returns 
     */
    static calcDaysBetween(first, end) {
        // Datas iguais
        if(first.getTime() == end.getTime())
            return 0

        // Auxiliar no cálculo dos dias
        const one_day = 24 * 60 * 60 * 1000

        // Calcula os dias
        return Math.ceil((first - end) / one_day)
    }

    /**
     * Retorna a data completa, no
     * formato dia/mês/ano.
     * 
     * @param {Date} date 
     * @returns 
     */
    static getFullDate(date) {
        return date.toLocaleString(
            'pt-BR',
            { timeZoneName: 'short' }
        )
        .split(' ')[0]
    }

    /**
     * Converte datas em formato dia/mês/ano
     * para o formato ISO.
     * 
     * @param {string} date 
     * @returns 
     */
    static formatDate(date) {
        let aux = date.split('/')
        let dateString = `${aux[2]}-${aux[1]}-${aux[0]}`

        return new Date(dateString)
    }

    /**
     * Retorna o dia da semana, em referencia à
     * data informada.
     * 
     * @param {Date} date 
     * @returns 
     */
    static getWeekday(date) {
        let utc_day = date.getUTCDay()

        const week = [
            'Domingo',
            'Segunda-feira',
            'Terça-feira',
            'Quarta-feira',
            'Quinta-feira',
            'Sexta-feira',
            'Sábado'
        ]

        return week[utc_day]
    }

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
     * Converte um valor no formato monetário
     * brasileiro para um float
     * 
     * @param {string} value 
     * @returns 
     */
    static moneyToFloat(value) {
        return parseFloat(
            value.replace('R$', '')
            .replace(/\./, '')
            .replace(/,/, '.')
            .trim()
        )
    }

    /**
     * Calcula o percentual de um valor
     * sobre o total.
     * 
     * @param {number} value 
     * @param {number} total 
     * @returns 
     */
    static percentage(value, total) {
        let perc = (value * 100 / total).toFixed(2)

        return `${perc.replace(/\./, ',')}%`
    }

    /**
     * Atualiza o estoque de um ingresso.
     * 
     * @param {number} quant Pode ser positivo (`quant > 0`) para aumentar o estoque,
     * ou negativo (`quant < 0`) para reduzir.
     * @param {number} lote_id Id do lote
     * @param {number} classe_id Id da classe de ingresso
     */
    static async updateEstoque(quant, lote_id, classe_id) {
        // Obtêm o lote atual e o seguinte
        const {
            lote_atual,
            lote_seguinte,
            vigente
        } = await tbl_itens_classes_ingressos.findAll({
            where: { itc_classe: classe_id },
            order: [
                [cast(col('itc_prioridade'), 'INT'), 'ASC'],
            ],
            attributes: [
                'itc_cod',
                'itc_quantidade'
            ]
        })
        .then(data => {
            // Lote informado
            let lote_atual = data.find(a => (
                a.itc_cod === lote_id
            ))

            // Index do primeiro lote não esgotado
            let index = data.findIndex(a => (
                a.itc_quantidade > 0
            ))

            // Se todos os lotes estiverem esgotados, obtêm o primeiro
            index = index >= 0 ? index : 0

            // Lote vigente
            let lote_vigente = data[index]

            // Próximo lote vigente
            let lote_seguinte = index < data.length ? data[++index] : null

            // Para baixas de estoque
            if(quant < 0) {
                // Lote atual é o vigente?
                if(
                    !lote_atual ||
                    lote_atual?.itc_cod !== lote_vigente?.itc_cod
                ) throw {
                    status: 400,
                    message: 'Lote não vigente'
                }

                // Baixa em estoque esgotado?
                if(!lote_atual.itc_quantidade) throw {
                    status: 400,
                    message: 'Ingresso esgotado'
                }
            }

            /**
             * Retorna os lotes: atual e seguinte,
             * assim como a verificação de lote vigente
            */
            return {
                lote_atual,
                lote_seguinte,
                vigente: lote_atual?.itc_cod === lote_vigente?.itc_cod
            }
        })

        // Se o lote não for o vigente, finaliza a execução
        if(!vigente) return 

        // Obtêm a classe do lote, no registro da loja
        let classe_loja = await tbl_classes_ingressos.findOne({
            where: { cla_cod: classe_id },
            attributes: ['cla_nome']
        })
        .then(result => {
            let nome = result.cla_nome.toLowerCase().replace(' ', '-')
            return [
                nome,
                `${nome}-meia`
            ]
        })

        // Obter o estoque da loja
        let estq_loja = await lltckt_product.findAll({
            where: {
                classId: classe_id,
                model: classe_loja
            },
            attributes: [
                'product_id',
                'quantity'
            ]
        })

        // Para baixas no estoque
        if(quant < 0) {
            // Há estoque o suficiente?
            if(
                lote_atual.itc_quantidade < quant ||
                !!estq_loja.find(a => a?.quantity < quant)
            ) throw {
                status: 400,
                message: 'Estoque insuficiente'
            }
        }

        // Atualiza o estoque do lote
        let estoque = lote_atual.itc_quantidade + quant

        // Registra a atualização
        await tbl_itens_classes_ingressos.update(
            { itc_quantidade: estoque },
            { where: {
                itc_cod: lote_atual.itc_cod
            }}
        )

        // Se o lote foi zerado
        if(estoque === 0) {
            // Se houver um lote seguinte, atualiza o estoque da loja com tal lote
            if(!!lote_seguinte && lote_seguinte.itc_quantidade > 0) {
                estoque = lote_seguinte.itc_quantidade
            }
        }

        // Atualiza o estoque da loja (se houver), com base no estoque do lote vigente
        if(!!estq_loja.length) {
            await lltckt_product.update(
                { quantity: estoque },
                { where: {
                    product_id: estq_loja.map(a => a?.product_id)
                }}
            )
        }
    }

    /**
     * Define a disponibilidade de uma cadeira numerada
     * e atualiza seu estoque.
     * 
     * @param {number} classe Id da classe do ingresso
     * @param {number[]} cadeiras Id das cadeiras
     * @param {number} lote_id Id do lote
     * @param {boolean} status Numerado disponível
     */
    static async setNumeradoStatus(classe, cadeiras, lote_id, status) {
        // Remove a alocação para cadeiras disponíveis
        let alocacao = {}
        if(status) {
            alocacao = {
                cln_lock_pos: null,
                cln_lock_expr: null
            }
        }

        // Atualiza a disponibilidade da cadeira
        await tbl_classe_numeracao.update(
            {
                cln_disp: status,
                ...alocacao
            },
            { where: {
                cln_cod: cadeiras
            }}
        )
        .then(async result => {
            if(!!result[0]) {
                let quant = cadeiras.length
                if(!status)
                    quant *= -1

                await tbl_itens_classes_ingressos.increment(
                    { itc_quantidade: quant },
                    { where: {
                        itc_cod: lote_id
                    }}
                )

                await lltckt_product.increment(
                    { quantity: quant },
                    { where: {
                        classId: classe
                    }}
                )
            }
        })
    }

    /**
     * Incrementa o estoque de ingressos de um solidário.
     * 
     * @param {number} quant Pode ser positivo (`quant > 0`) para aumentar o estoque,
     * ou negativo (`quant < 0`) para reduzir.
     * @param {number} classe Id da classe do ingresso
     * @param {string} solidario Nome do solidário
     */
    static async solidarioIncrement(quant, classe, solidario) {
        // Se a quantidade for negativa, verifica se há estoque disponível
        if(quant < 0) {
            await tbl_classe_ingressos_solidario.findOne({
                where: {
                    cis_cod_classe_ingresso: classe,
                    cis_nome: solidario,
                    cis_quantidade: { $lt: -quant }
                },
                attributes: ['cis_cod']
            })
            .then(data => {
                if(!!data) throw {
                    status: 400,
                    message: 'Estoque insuficiente no solidário'
                }
            })
        }

        // Atualiza o solidário
        await tbl_classe_ingressos_solidario.increment(
            { cis_quantidade: quant },
            { where: {
                cis_cod_classe_ingresso: classe,
                cis_nome: solidario
            }}
        )
    }

}