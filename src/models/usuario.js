import schemas from '../schemas/index.js'
import Auth from './auth.js'
import crypto from 'crypto-js'

const {
    lltckt_manufacturer,
    lltckt_user,
} = schemas.ticketsl_loja

/**
 * Regras de negócio dos Usuários.
 */
export default class Usuario {

    /**
     * Realiza a validação de acesso (login) do usuário
     * informado.
     * 
     * @param {string} login Login do usuário
     * @param {string} senha senha de acesso
     */
    static async login(login, senha) {
        // Login do Admin
        const find_admin = await lltckt_user.findOne({
            where: { email: login, status: 1 },
            attributes: [
                'user_id',
                'password',
                'salt'
            ]
        })

        // Procura pelo Promotor
        const find_promo = await lltckt_manufacturer.findOne({
            where: { email: login },
            attributes: [
                'manufacturer_id',
                'senha'
            ]
        })

        // Usuário não encontrado
        if(!find_promo && !find_admin) throw {
            status: 400,
            message: 'Usuário incorreto'
        }

        let senha_compare
        let token

        if(!!find_admin) {
            let user = find_admin.get()

            // Gera a criptografia da senha
            let senha_compare = crypto.SHA1(senha).toString()
            for (let i = 0; i < 2; i++) {
                senha_compare = crypto.SHA1(user.salt + senha_compare).toString()
            }

            // Senha incorreta?
            if(user.password !== senha_compare) throw {
                status: 400,
                message: 'Senha incorreta'
            }

            // Gera o token de acesso
            token = Auth.generateAuth(
                true,
                '%'
            )
        }
        else {
            // Gera a criptografia da senha
            senha_compare = crypto.MD5(senha).toString()

            // Senha incorreta?
            if(find_promo.getDataValue('senha') !== senha_compare) throw {
                status: 400,
                message: 'Senha incorreta'
            }

            // Gera o token de acesso
            token = Auth.generateAuth(
                false,
                find_promo.getDataValue('manufacturer_id')
            )
        }

        return { token }
    }
}