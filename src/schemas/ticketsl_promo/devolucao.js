import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import caixa from './caixa.js'


/**
 * Tabela das devoluções nos caixas
 * 
 * foreign key:
 * - caixa (CAIXA → CODIGO)
 */
const devolucao = db_conn.define(
    'devolucao',
    {
        CODIGO: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        CAIXA: {
            type: DataTypes.INTEGER(11)
        },

        VALOR: {
            type: DataTypes.DECIMAL(10,2)
        },

        DATA_HORA: {
            type: DataTypes.DATE
        },

        HISTORICO: {
            type: DataTypes.STRING(255)
        }
    }
)

// foreign key

// caixa (CAIXA → CODIGO)
caixa.hasMany(devolucao, {
    foreignKey: 'CAIXA',
    sourceKey: 'CODIGO',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
devolucao.belongsTo(caixa, {
    foreignKey: 'CAIXA',
    targetKey: 'CODIGO'
})

export default devolucao