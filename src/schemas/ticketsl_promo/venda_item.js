import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import item from './item.js'
import venda from './venda.js'


/**
 * Tabela ponte entre: os itens e as vendas do bar
 * 
 * foreign keys:
 * - item (ITEM → CODIGO)
 * - venda (PARENT → CODIGO)
 */
const venda_item = db_conn.define(
    'venda_item',
    {
        CODIGO: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        PARENT: {
            type: DataTypes.INTEGER(11)
        },

        ITEM: {
            type: DataTypes.INTEGER(11)
        },

        VALOR_UN: {
            type: DataTypes.DECIMAL(10,2)
        },

        QUANTIDADE: {
            type: DataTypes.DECIMAL(10,2)
        },

        VALOR_TOTAL: {
            type: DataTypes.DECIMAL(10,2)
        }
    }
)


// foreign keys

// item (ITEM → CODIGO)
item.hasMany(venda_item, {
    foreignKey: 'ITEM',
    sourceKey: 'CODIGO',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
venda_item.belongsTo(item, {
    foreignKey: 'ITEM',
    targetKey: 'CODIGO'
})

// venda (PARENT → CODIGO)
venda.hasMany(venda_item, {
    foreignKey: 'PARENT',
    sourceKey: 'CODIGO',
    onUpdate: 'restrict',
    onDelete: 'cascade',
    hooks: true
})
venda_item.belongsTo(venda, {
    foreignKey: 'PARENT',
    targetKey: 'CODIGO'
})

export default venda_item