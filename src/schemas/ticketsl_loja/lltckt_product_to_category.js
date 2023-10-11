import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import lltckt_product from './lltckt_product.js'
import lltckt_category from './lltckt_category.js'


/**
 * Tabela ponte entre os produtos (lltckt_product)
 * e as categorias (lltckt_category) da loja.
 * 
 * foreign keys:
 * - lltckt_product (product_id → product_id)
 * - lltckt_category (category_id → category_id)
 */
const lltckt_product_to_category = db_conn.define(
    'lltckt_product_to_category',
    {
        product_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        category_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        }
    },
    { schema: process.env.DB_LOJA }
)

// foreign keys

// lltckt_product (product_id → product_id)
lltckt_product.hasOne(lltckt_product_to_category, {
    foreignKey: 'product_id',
    sourceKey: 'product_id',
    hooks: true
})
lltckt_product_to_category.belongsTo(lltckt_product, {
    foreignKey: 'product_id',
    targetKey: 'product_id'
})

// lltckt_category (category_id → category_id)
lltckt_category.hasMany(lltckt_product_to_category, {
    foreignKey: 'category_id',
    sourceKey: 'category_id',
    hooks: true
})
lltckt_product_to_category.belongsTo(lltckt_category, {
    foreignKey: 'category_id',
    targetKey: 'category_id'
})

export default lltckt_product_to_category