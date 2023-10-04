import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_ingressos from './tbl_ingressos.js'
import tbl_status_impressao from './tbl_status_impressao.js'
import tbl_venda_ingressos from './tbl_venda_ingressos.js'


/**
 * Tabela ponte entre: os ingressos (tbl_ingressos)
 * e o status da impressão (tbl_status_impressao)
 * 
 * foreign keys:
 * - tbl_ingressos (ing_cod_barras → ing_cod_barras)
 * - tbl_status_impressao (imp_id → imp_id)
 * - tbl_venda_ingressos (imp_venda → vend_id)
 */
const tbl_venda_impressao = db_conn.define(
    'tbl_venda_impressao',
    {
        imp_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        
        imp_status: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        
        ing_cod_barras: {
            type: DataTypes.DECIMAL(60,0),
            unique: true
        },
        
        imp_reimpresso: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },

        imp_venda: {
            type: DataTypes.INTEGER
        }
    }
)

// foreign keys:

// tbl_ingressos (ing_cod_barras → ing_cod_barras)
tbl_ingressos.hasOne(tbl_venda_impressao, {
    foreignKey: 'ing_cod_barras',
    sourceKey: 'ing_cod_barras',
    onDelete: 'cascade',
    hooks: true
})
tbl_venda_impressao.belongsTo(tbl_ingressos, {
    foreignKey: 'ing_cod_barras',
    targetKey: 'ing_cod_barras'
})

// tbl_status_impressao (imp_id → imp_id)
tbl_status_impressao.hasOne(tbl_venda_impressao, {
    foreignKey: 'imp_status',
    sourceKey: 'simp_id',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_venda_impressao.belongsTo(tbl_status_impressao, {
    foreignKey: 'imp_status',
    targetKey: 'simp_id',
    as: 'status'
})

// tbl_venda_ingressos (imp_venda → vend_id)
tbl_venda_ingressos.hasOne(tbl_venda_impressao, {
    foreignKey: 'imp_venda',
    sourceKey: 'vend_id',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_venda_ingressos.hasOne(tbl_venda_impressao, {
    foreignKey: 'imp_venda',
    sourceKey: 'vend_id',
    as: 'impressao',
    hooks: true
})
tbl_venda_impressao.belongsTo(tbl_venda_ingressos, {
    foreignKey: 'imp_venda',
    targetKey: 'vend_id'
})

export default tbl_venda_impressao