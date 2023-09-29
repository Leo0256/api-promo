import { Eventos } from '../models/index.js'

/**
 * Controlador dos Eventos
 */
export default class EventosController {

    /**
     * Retorna a lista dos Eventos do Promotor
     * na tela home.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getEventos(req, res) {
        let { user_id } = req.body['token_data']
        let { p, tipo } = req.query

        await Eventos.getEventos(user_id, null, tipo, p)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter os Eventos',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna as informações gerais das vendas do Evento.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getInfo(req, res) {
        let { user_id } = req.body['token_data']
        let { evento, categoria } = req.query

        await Eventos.getInfo(user_id, evento, categoria)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter a Situação do Evento',
                message: e?.message ?? null
            })
        })
    }

    /**
     * 
     * @param {import('express').Request} req 
     * @param {import('express').Response} res 
     */
    static async getClasses(req, res) {
        let { evento } = req.query

        await Eventos.getClasses(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: ''
            })
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
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getDetalhados(req, res) {
        let {
            evento,
            filtros,
            busca,
            linhas,
            pagina
        } = req.body

        await Eventos.getDetalhados(evento, filtros, busca, linhas, pagina)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter as Vendas Detalhadas',
                message: e?.message ?? null
            })
        })
    }

    /**
     * Retorna os filtros do relatório detalhado.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async getDetalhadosFilter(req, res) {
        let { evento } = req.query

        await Eventos.getDetalhadosFilter(evento)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500).json({
                error: 'Falha ao Obter os Filtros',
                message: e?.message ?? null
            })
        })
    }

}