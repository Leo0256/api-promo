import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import lltckt_category from './lltckt_category.js'
import lltckt_manufacturer from './lltckt_manufacturer.js'


/**
 * Tabela ponte entre as categorias e os Promotores
 * 
 * foreign keys:
 * - lltckt_category (id_Category → category_id)
 * - lltckt_manufacturer (id_promoter → manufacturer_id)
 */
const lltckt_category_to_promoter = db_conn.define(
    'lltckt_category_to_promoter',
    {
        id_Category: {
            type: DataTypes.INTEGER(11)
        },

        id_promoter: {
            type: DataTypes.INTEGER(11)
        },

        tipo: {
            type: DataTypes.TINYINT(1)
        }
    }
)

// foreign keys:

// lltckt_category (id_Category → category_id)
lltckt_category.hasMany(lltckt_category_to_promoter, {
    foreignKey: 'id_Category',
    sourceKey: 'category_id',
    hooks: true
})
lltckt_category_to_promoter.belongsTo(lltckt_category, {
    foreignKey: 'id_Category',
    targetKey: 'category_id'
})

// lltckt_manufacturer (id_promoter → manufacturer_id)
lltckt_manufacturer.hasMany(lltckt_category_to_promoter, {
    foreignKey: 'id_promoter',
    sourceKey: 'manufacturer_id',
    hooks: true
})
lltckt_category_to_promoter.belongsTo(lltckt_manufacturer, {
    foreignKey: 'id_promoter',
    targetKey: 'manufacturer_id'
})

export default lltckt_category_to_promoter