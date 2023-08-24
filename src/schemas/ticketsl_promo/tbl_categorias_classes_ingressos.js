import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_eventos from './tbl_eventos.js'


/**
 * Tabela das categorias das classes de ingresso
 * 
 * foreign key:
 * - tbl_eventos (cat_evento → eve_cod)
 */
const tbl_categorias_classes_ingressos = db_conn.define(
    'tbl_categorias_classes_ingressos',
    {
        cat_cod: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        cat_evento: {
            type: DataTypes.INTEGER(11)
        },

        cat_nome: {
            type: DataTypes.STRING(255)
        },

        cat_data_inclusao: {
            type: DataTypes.DATE
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign key

// tbl_eventos (cat_evento → eve_cod)
tbl_eventos.hasMany(tbl_categorias_classes_ingressos, {
    foreignKey: 'cat_evento',
    sourceKey: 'eve_cod',
    onDelete: 'cascade',
    hooks: true
})
tbl_categorias_classes_ingressos.belongsTo(tbl_eventos, {
    foreignKey: 'cat_evento',
    targetKey: 'eve_cod'
})

export default tbl_categorias_classes_ingressos