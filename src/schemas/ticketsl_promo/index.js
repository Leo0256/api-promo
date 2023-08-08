//Mapeamento do Banco de Dados: 'ticketsl_promo'

import tbl_eventos from './tbl_eventos.js'

/**
 * Tabelas do banco, ordenadas pela referência das foreign keys
 */
const schemas = {
    tbl_eventos
}

const syncModels = async () => {
    for(let [key, value] of Object.entries(schemas)) {
        schemas[key] = await value.sync()
    }
}

syncModels()

export default schemas