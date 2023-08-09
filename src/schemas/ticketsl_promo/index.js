//Mapeamento do Banco de Dados: 'ticketsl_promo'

import tbl_classes_ingressos from './tbl_classes_ingressos.js'
import tbl_eventos from './tbl_eventos.js'
import tbl_ingressos from './tbl_ingressos.js'

/**
 * Tabelas do banco, ordenadas pela referência das foreign keys
 */
const schemas = {
    tbl_eventos,
    tbl_classes_ingressos,
    tbl_ingressos,
}

const syncModels = async () => {
    for(let [key, value] of Object.entries(schemas)) {
        schemas[key] = await value.sync()
    }
}

syncModels()

export default schemas