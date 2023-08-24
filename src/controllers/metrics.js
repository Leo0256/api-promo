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
        let { evento, categoria } = req.query

        await Metrics.getTiposIngressos(evento, categoria)
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

}