import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_eventos from './tbl_eventos.js'
import tbl_pdvs from './tbl_pdvs.js'


/**
 * Tabela das sangrias
 * 
 * foreign keys:
 * - tbl_eventos (san_evento → eve_cod)
 * - tbl_pdvs (san_pdv → pdv_id)
 */
const tbl_sangria = db_conn.define(
    'tbl_sangria',
    {
        san_codigo: {
            type: DataTypes.INTEGER(60).UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        
        san_evento: {
            type: DataTypes.INTEGER(60)
        },
        
        san_pdv: {
            type: DataTypes.INTEGER(60)
        },
        san_pos: {
            type: DataTypes.STRING(60)
        },
        
        san_cliente: {
            type: DataTypes.INTEGER(60)
        },
        
        san_usuario: {
            type: DataTypes.INTEGER(60)
        },
        
        san_data_hora: {
            type: DataTypes.DATE
        },
        
        san_valor: {
            type: DataTypes.DOUBLE(20,2)
        }
    }
)

// foreign keys

// tbl_eventos (san_evento → eve_cod)
tbl_eventos.hasMany(tbl_sangria, {
    foreignKey: 'san_evento',
    sourceKey: 'eve_cod',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_sangria.belongsTo(tbl_eventos, {
    foreignKey: 'san_evento',
    targetKey: 'eve_cod'
})

// tbl_pdvs (san_pdv → pdv_id)
tbl_pdvs.hasMany(tbl_sangria, {
    foreignKey: 'san_pdv',
    sourceKey: 'pdv_id',
    onUpdate: 'restrict',
    onDelete: 'restrict',
    hooks: true
})
tbl_sangria.belongsTo(tbl_pdvs, {
    foreignKey: 'san_pdv',
    targetKey: 'pdv_id'
})

export default tbl_sangria