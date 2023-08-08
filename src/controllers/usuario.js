import { Usuario } from '../models/index.js'

/**
 * Controlador dos Usuários
 */
export default class UsuarioController {

    /**
     * Realiza a validação de acesso (login) do usuário
     * informado.
     * 
     * @param {Request} req 
     * @param {Response} res 
     */
    static async login(req, res) {
        let { login, senha } = req.body

        await Usuario.login(login, senha)
        .then(result => res.json(result))
        .catch(e => {
            console.error(e)
            res.status(e?.status ?? 500)
            res.json({
                error: 'Falha no login',
                message: e?.message ?? null
            })
        })
    }
}