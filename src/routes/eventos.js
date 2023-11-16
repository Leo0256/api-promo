import { Router } from 'express'
import { Eventos } from '../controllers/index.js'
import { Auth } from '../models/index.js'
const router = Router()

// Requerimento de token
router.use(Auth.validadeAuth)
router.get('/', Eventos.getEventos)
router.get('/info', Eventos.getInfo)
router.get('/classes', Eventos.getClasses)
router.get('/pdvs', Eventos.getPDVs)
router.get('/diarios', Eventos.getDiarios)
router.get('/numerados', Eventos.getNumerados)
router.get('/cancelados', Eventos.getCancelados)

router.post('/detalhados', Eventos.getDetalhados)
router.get('/detalhados/filtros', Eventos.getDetalhadosFilter)
router.post('/site', Eventos.getSiteDetalhados)
router.get('/site/filtros', Eventos.getSiteDetalhadosFilter)

router.get('/sangrias', Eventos.getSangrias)

export default router