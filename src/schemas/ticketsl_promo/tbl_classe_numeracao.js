import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_classe_grupo from './tbl_classe_grupo.js'
import tbl_eventos from './tbl_eventos.js'
import tbl_classes_ingressos from './tbl_classes_ingressos.js'


/**
 * Tabela dos assentos numerados dos ingressos
 * 
 * foreign keys:
 * - tbl_classe_grupo (clg_cod → clg_cod)
 * - tbl_eventos (eve_cod → eve_cod)
 * - tbl_classes_ingressos (cla_cod → cla_cod)
 */
const tbl_classe_numeracao = db_conn.define(
    'tbl_classe_numeracao',
    {
        cln_cod: {
            type: DataTypes.INTEGER(60).UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },

        clg_cod: {
            type: DataTypes.INTEGER(11).UNSIGNED
        },

        eve_cod: {
            type: DataTypes.INTEGER(60)
        },

        cla_cod: {
            type: DataTypes.INTEGER(60)
        },

        cln_num: {
            type: DataTypes.STRING
        },

        cln_disp: {
            type: DataTypes.TINYINT(1).UNSIGNED
        },

        cln_lock_pos: {
            type: DataTypes.STRING
        },

        cln_lock_expr: {
            type: DataTypes.DATE
        },

        cln_texto_impresso: {
            type: DataTypes.STRING
        },

        cln_texto_pos: {
            type: DataTypes.STRING
        },

        cln_mapa_id: {
            type: DataTypes.STRING
        },

        cln_cortesia: {
            type: DataTypes.TINYINT(1)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

// tbl_classe_grupo (clg_cod → clg_cod)
tbl_classe_grupo.hasMany(tbl_classe_numeracao, {
    foreignKey: 'clg_cod',
    sourceKey: 'clg_cod',
    onDelete: 'cascade',
    as: 'numerados',
    hooks: true
})
tbl_classe_numeracao.belongsTo(tbl_classe_grupo, {
    foreignKey: 'clg_cod',
    targetKey: 'clg_cod'
})

// tbl_eventos (eve_cod → eve_cod)
tbl_eventos.hasMany(tbl_classe_numeracao, {
    foreignKey: 'eve_cod',
    sourceKey: 'eve_cod',
    onDelete: 'cascade',
    hooks: true
})
tbl_classe_numeracao.belongsTo(tbl_eventos, {
    foreignKey: 'eve_cod',
    targetKey: 'eve_cod'
})

// tbl_classes_ingressos (cla_cod → cla_cod)
tbl_classes_ingressos.hasMany(tbl_classe_numeracao, {
    foreignKey: 'cla_cod',
    sourceKey: 'cla_cod',
    onDelete: 'cascade',
    hooks: true
})
tbl_classe_numeracao.belongsTo(tbl_classes_ingressos, {
    foreignKey: 'cla_cod',
    targetKey: 'cla_cod'
})

export default tbl_classe_numeracao