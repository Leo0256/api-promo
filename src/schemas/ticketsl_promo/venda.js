import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import caixa from './caixa.js'


/**
 * Tabela das vendas dos caixas
 * 
 * foreign key:
 * - caixa (CAIXA → CODIGO)
 */
const venda = db_conn.define(
    'venda',
    {
        CODIGO: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        CAIXA: {
            type: DataTypes.INTEGER(11)
        },

        VALOR_TOTAL: {
            type: DataTypes.DECIMAL(10,2)
        },

        DATA_HORA: {
            type: DataTypes.DATE
            // timestamp
        }
    }
)

// foreign key

// caixa (CAIXA → CODIGO)
caixa.hasMany(venda, {
    foreignKey: 'CAIXA',
    sourceKey: 'CODIGO',
    onUpdate: 'restrict',
    onDelete: 'cascade',
    hooks: true
})
venda.belongsTo(caixa, {
    foreignKey: 'CAIXA',
    targetKey: 'CODIGO'
})

export default venda