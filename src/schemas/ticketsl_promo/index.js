//Mapeamento do Banco de Dados: 'ticketsl_promo'

import caixa from './caixa.js'
import devolucao from './devolucao.js'
import item from './item.js'
import tbl_classes_ingressos from './tbl_classes_ingressos.js'
import tbl_eventos from './tbl_eventos.js'
import tbl_ingressos from './tbl_ingressos.js'
import tbl_pdvs from './tbl_pdvs.js'
import tbl_sangria from './tbl_sangria.js'
import venda_item from './venda_item.js'
import venda from './venda.js'

/**
 * Tabelas do banco, ordenadas pela referência das foreign keys
 */
const schemas = {
    tbl_eventos,
    tbl_classes_ingressos,
    tbl_ingressos,
    tbl_pdvs,
    tbl_sangria,
    caixa,
    devolucao,
    venda,
    item,
    venda_item,
}

const syncModels = async () => {
    for(let [key, value] of Object.entries(schemas)) {
        schemas[key] = await value.sync()
    }
}

syncModels()

export default schemas