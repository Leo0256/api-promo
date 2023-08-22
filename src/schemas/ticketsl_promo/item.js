import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_eventos from './tbl_eventos.js'


/**
 * Tabela dos itens do bar
 * 
 * foreign key:
 * - tbl_eventos (EVENTO_CODIGO → eve_cod)
 */
const item = db_conn.define(
    'item',
    {
        CODIGO: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        NOME: {
            type: DataTypes.STRING(40)
        },

        NOME_IMPRESSAO: {
            type: DataTypes.STRING(255)
        },

        PRECO: {
            type: DataTypes.DECIMAL(10,2)
        },

        ATIVO: {
            type: DataTypes.STRING(1)
        },

        EVENTO_CODIGO: {
            type: DataTypes.INTEGER(11)
        },

        HASH_FILHOS: {
            type: DataTypes.STRING(32)
        },

        SALDO_INICIAL: {
            type: DataTypes.INTEGER(11)
        },

        CUSTO_UN: {
            type: DataTypes.DECIMAL(7,2)
        }
    }
)

// foreign key

// tbl_eventos (EVENTO_CODIGO → eve_cod)
tbl_eventos.hasMany(item, {
    foreignKey: 'EVENTO_CODIGO',
    sourceKey: 'eve_cod',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
item.belongsTo(tbl_eventos, {
    foreignKey: 'EVENTO_CODIGO',
    targetKey: 'eve_cod'
})

export default item