import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela dos status dos pedidos na loja/site.
 */
const lltckt_order_status = db_conn.define(
    'lltckt_order_status',
    {
        order_status_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        language_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING(32)
        }
    },
    { schema: process.env.DB_LOJA }
)

export default lltckt_order_status