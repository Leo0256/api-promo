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

        await Eventos.getEventos(user_id)
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
}