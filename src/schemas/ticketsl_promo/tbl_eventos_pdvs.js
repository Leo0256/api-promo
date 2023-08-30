import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_pdvs from './tbl_pdvs.js'
import tbl_eventos from './tbl_eventos.js'


/**
 * Tabela ponte entre: os PDVs (tbl_pdvs)
 * e os Eventos (tbl_eventos).
 * 
 * foreign keys:
 * - tbl_pdvs (evp_pdv → pdv_id)
 * - tbl_eventos (evp_evento → eve_cod)
 */
const tbl_eventos_pdvs = db_conn.define(
    'tbl_eventos_pdvs',
    {
        evp_id: {
            type: DataTypes.INTEGER(10),
            autoIncrement: true,
            primaryKey: true
        },

        evp_pdv: {
            type: DataTypes.INTEGER(60)
        },

        evp_evento: {
            type: DataTypes.INTEGER(60)
        },

        evp_empresa: {
            type: DataTypes.INTEGER(60)
        },

        evp_taxa: {
            type: DataTypes.TINYINT(1)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

// tbl_pdvs (evp_pdv → pdv_id)
tbl_pdvs.hasMany(tbl_eventos_pdvs, {
    foreignKey: 'evp_pdv',
    sourceKey: 'pdv_id',
    onDelete: 'cascade',
    hooks: true
})
tbl_eventos_pdvs.belongsTo(tbl_pdvs, {
    foreignKey: 'evp_pdv',
    targetKey: 'pdv_id'
})

// tbl_eventos (evp_evento → eve_cod)
tbl_eventos.hasMany(tbl_eventos_pdvs, {
    foreignKey: 'evp_evento',
    sourceKey: 'eve_cod',
    onDelete: 'cascade',
    hooks: true
})
tbl_eventos_pdvs.belongsTo(tbl_eventos, {
    foreignKey: 'evp_evento',
    targetKey: 'eve_cod'
})

export default tbl_eventos_pdvs