import { Router } from 'express'
const routes = Router()

import Eventos from './eventos.js'
import Usuario from './usuario.js'

routes.use('/eventos', Eventos)
routes.use('/user', Usuario)

routes.use('*', (_, res) => (
    res.status(404).send({ error: 'API desconhecida' })
))

export default routes