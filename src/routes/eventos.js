import { Router } from 'express'
import { Eventos } from '../controllers/index.js'
import { Auth } from '../models/index.js'
const router = Router()

// Requerimento de token
router.use(Auth.validadeAuth)
router.get('/', Eventos.getEventos)

export default router