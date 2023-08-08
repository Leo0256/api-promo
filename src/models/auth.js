import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

/**
 * Regras de negócio do token de acesso.
 */
export default class Auth {

    /**
     * Valida e decodifica o token de acesso.
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    static validadeAuth(req, res, next) {
        const token = req.headers['token']

        // Nenhum token informado?
        if(!token) {
            return res.status(401).json({
                error: 'Acesso não autorizado',
                message: 'Nenhum token informado no header'
            })
        }

        jwt.verify(
            token,
            process.env.JWT_SECRET, // key
            (err, decoded) => {
                // Falha ao autenticar o token
                if(err) {
                    console.error(err)
                    return res.status(401).json({
                        error: 'Acesso não Autorizado',
                        message: 'Falha ao autenticar o token'
                    })
                }

                req.body['token_data'] = decoded
                next()
            }
        )
    }

    /**
     * Gera um novo token de acesso.
     * 
     * @param {boolean} admin Usuário Admin ou Promotor
     * @param {number} user_id Id do usuário
     */
    static generateAuth(admin, user_id) {
        return jwt.sign(
            { admin, user_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )
    }
}