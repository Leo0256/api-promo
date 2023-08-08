//Mapeamento do Banco de Dados: 'ticketsl_loja'

import lltckt_category_to_promoter from './lltckt_category_to_promoter.js'
import lltckt_category from './lltckt_category.js'
import lltckt_eve_categorias from './lltckt_eve_categorias.js'
import lltckt_manufacturer from './lltckt_manufacturer.js'
import lltckt_user from './lltckt_user.js'

/**
 * Tabelas do banco, ordenadas pela referência das foreign keys
 */
const schemas = {
    lltckt_category,
    lltckt_eve_categorias,
    lltckt_manufacturer,
    lltckt_user,
    lltckt_category_to_promoter,
}

const syncModels = async () => {
    for(let [key, value] of Object.entries(schemas)) {
        schemas[key] = await value.sync()
    }
}

syncModels()

export default schemas