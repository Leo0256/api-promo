import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_eventos from './tbl_eventos.js'

/**
 * Tabela das vendas dos ingressos
 * 
 * foreign keys:
 * - tbl_eventos (vend_evento → eve_cod)
 */
const tbl_venda_ingressos = db_conn.define(
    'tbl_venda_ingressos',
    {
        vend_id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        vend_pagseguro_cod: {
            type: DataTypes.STRING(50)
        },

        vend_data: {
            type: DataTypes.DATE
        },

        vend_evento: {
            type: DataTypes.INTEGER(60)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

// tbl_eventos (vend_evento → eve_cod)
tbl_eventos.hasMany(tbl_venda_ingressos, {
    foreignKey: 'vend_evento',
    sourceKey: 'eve_cod',
    hooks: true
});
tbl_venda_ingressos.belongsTo(tbl_eventos, {
    foreignKey: 'vend_evento',
    targetKey: 'eve_cod',
    as: 'evento'
})

export default tbl_venda_ingressos