import { Router } from 'express'
import { Metrics } from '../controllers/index.js'
import { Auth } from '../models/index.js'
const router = Router()

// Requerimento de token
router.use(Auth.validadeAuth)
router.get('/tipo_ingresso', Metrics.getTiposIngressos)
router.get('/classes', Metrics.getClasses)
router.get('/lotes', Metrics.getLotes)
router.get('/pdvs', Metrics.getRankingPdvs)
router.get('/mpgto', Metrics.getFaturamento)

export default router