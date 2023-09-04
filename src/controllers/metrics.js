import { Metrics } from '../models/index.js'

/**
 * Controlador das Métricas e Gráficos
 */
export default class MetricsController {

    /**
     * Retorna os dados do gráfico "Tipos de Ingressos",
     * tela de venda geral.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getTiposIngressos(req, res) {
        let { evento } = req.query

        await Metrics.getTiposIngressos(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter o Gráfico "Tipos de Ingressos"',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna os dados do gráfico de barras "Classes",
     * tela de venda geral.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getClasses(req, res) {
        let { evento } = req.query

        await Metrics.getClasses(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter o Gráfico "Classes"',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna os dados do gráfico de barras "Vendas por Lote",
     * tela de venda geral.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getLotes(req, res) {
        let { evento } = req.query

        await Metrics.getLotes(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter o Gráfico "Vendas por Lote"',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna os dados da tabela "Ranking de Pdvs",
     * tela de venda geral.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getRankingPdvs(req, res) {
        let { evento } = req.query

        await Metrics.getRankingPdvs(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter a Tabela "Ranking de Pdvs"',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna os dados do gráfico de barras "Faturamento por Meio de Pagamento",
     * tela de venda geral.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getFaturamento(req, res) {
        let { evento } = req.query

        await Metrics.getFaturamento(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter o Gráfico "Faturamento por Meio de Pagamento"',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna os dados do gráfico "Gráfico Periódico",
     * tela de venda geral.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getPeriodico(req, res) {
        let { evento } = req.query

        await Metrics.getPeriodico(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter o Gráfico "Gráfico Periódico"',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna os dados do gráfico "Horário x Canal de Venda",
     * tela de venda geral.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getHorarioVenda(req, res) {
        let { evento } = req.query

        await Metrics.getHorarioVenda(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter o Gráfico "Horário x Canal de Venda"',
                message: e?.message ?? null
            })
        })
    }

}