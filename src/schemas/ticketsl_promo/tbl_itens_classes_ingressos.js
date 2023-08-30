import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_classes_ingressos from './tbl_classes_ingressos.js'


/**
 * Tabela com o estoque das classes de ingressos
 * 
 * foreign key:
 * - tbl_classes_ingressos (itc_classe → cla_cod)
 */
const tbl_itens_classes_ingressos = db_conn.define(
    'tbl_itens_classes_ingressos',
    {
        itc_cod: {
            type: DataTypes.INTEGER(60),
            autoIncrement: true,
            primaryKey: true
        },

        itc_classe: {
            type: DataTypes.INTEGER(60)
        },

        itc_quantidade: {
            type: DataTypes.INTEGER(5)
        },

        itc_valor: {
            type: DataTypes.DECIMAL(14,2)
        },

        itc_prioridade: {
            type: DataTypes.STRING(60)
        },

        itc_data_inclusao: {
            type: DataTypes.DATE
        },

        itc_data_virada: {
            type: DataTypes.DATEONLY
        },

        itc_data_modificacao: {
            type: DataTypes.DATE
        },

        itc_login_modificacao: {
            type: DataTypes.STRING
        },

        itc_ip_modificacao: {
            type: DataTypes.STRING(40)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

// tbl_classes_ingressos (itc_classe → cla_cod)
tbl_classes_ingressos.hasMany(tbl_itens_classes_ingressos, {
    foreignKey: 'itc_classe',
    sourceKey: 'cla_cod',
    onDelete: 'cascade',
    hooks: true
})
tbl_classes_ingressos.hasMany(tbl_itens_classes_ingressos, {
    foreignKey: 'itc_classe',
    as: 'lotes'
})
tbl_itens_classes_ingressos.belongsTo(tbl_classes_ingressos, {
    foreignKey: 'itc_classe',
    targetKey: 'cla_cod'
})

export default tbl_itens_classes_ingressos