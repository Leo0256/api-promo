import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_ingressos from '../ticketsl_promo/tbl_ingressos.js'
import lltckt_order_product from './lltckt_order_product.js'


/**
 * Tabela ponte entre: ticketsl_promo.tbl_ingressos
 * e ticketsl_loja.lltckt_order_product
 * 
 * foreign keys:
 * - ticketsl_promo.tbl_ingressos (barcode → ing_cod_barras)
 * - ticketsl_loja.lltckt_order_product (order_product_id → order_product_id)
 */
const lltckt_order_product_barcode = db_conn.define(
    'lltckt_order_product_barcode',
    {
        barcode: {
            type: DataTypes.DECIMAL(60,0),
            primaryKey: true
        },

        order_product_id: {
            type: DataTypes.INTEGER(11)
        }
    },
    { schema: process.env.DB_LOJA }
)

// foreign keys

// ticketsl_promo.tbl_ingressos (barcode → ing_cod_barras)
tbl_ingressos.hasOne(lltckt_order_product_barcode, {
    foreignKey: 'barcode',
    sourceKey: 'ing_cod_barras',
    onDelete: 'cascade',
    hooks: true
})
lltckt_order_product_barcode.belongsTo(tbl_ingressos, {
    foreignKey: 'barcode',
    targetKey: 'ing_cod_barras'
})

// ticketsl_loja.lltckt_order_product (order_product_id → order_product_id)
lltckt_order_product.hasMany(lltckt_order_product_barcode, {
    foreignKey: 'order_product_id',
    sourceKey: 'order_product_id',
    onDelete: 'cascade',
    hooks: true
})
lltckt_order_product_barcode.belongsTo(lltckt_order_product, {
    foreignKey: 'order_product_id',
    targetKey: 'order_product_id'
})

export default lltckt_order_product_barcode