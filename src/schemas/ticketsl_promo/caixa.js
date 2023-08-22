import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_eventos from './tbl_eventos.js'


/**
 * Tabela dos caixas nos eventos
 * 
 * foreign key:
 * - tbl_eventos (EVENTO_CODIGO → eve_cod)
 */
const caixa = db_conn.define(
    'caixa',
    {
        CODIGO: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        NOME: {
            type: DataTypes.STRING(40)
        },

        FECHADO: {
            type: DataTypes.STRING(1)
        },

        EVENTO_CODIGO: {
            type: DataTypes.INTEGER(11)
        },

        DATA_HORA_ABERTURA: {
            type: 'TIMESTAMP'
        },

        DATA_HORA_FECHAMENTO: {
            type: 'TIMESTAMP'
        },

        TOTAL_DINHEIRO: {
            type: DataTypes.DECIMAL(10,2)
        },

        TOTAL_DEBITO: {
            type: DataTypes.DECIMAL(10,2)
        },

        TOTAL_CREDITO: {
            type: DataTypes.DECIMAL(10,2)
        }
    }
)

// foreign key

// tbl_eventos (EVENTO_CODIGO → eve_cod)
tbl_eventos.hasMany(caixa, {
    foreignKey: 'EVENTO_CODIGO',
    sourceKey: 'eve_cod',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
caixa.belongsTo(tbl_eventos, {
    foreignKey: 'EVENTO_CODIGO',
    targetKey: 'eve_cod'
})

export default caixa