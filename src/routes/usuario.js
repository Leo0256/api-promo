import { Router } from 'express'
import { Usuario } from '../controllers/index.js'
const router = Router()

router.post('/login', Usuario.login)

export default router