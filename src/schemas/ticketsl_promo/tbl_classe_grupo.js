import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_classes_ingressos from './tbl_classes_ingressos.js'


/**
 * Tabela dos grupos de assentos nos ingressos numerados
 * 
 * foreign key:
 * - tbl_classes_ingressos (cla_cod → cla_cod)
 */
const tbl_classe_grupo = db_conn.define(
    'tbl_classe_grupo',
    {
        clg_cod: {
            type: DataTypes.INTEGER(11).UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        
        cla_cod: {
            type: DataTypes.INTEGER(60)
        },
        
        clg_prefixo: {
            type: DataTypes.STRING(10)
        },
        
        clg_sufixo: {
            type: DataTypes.STRING(5)
        },
        
        clg_inicial: {
            type: DataTypes.INTEGER(11)
        },
        
        clg_final: {
            type: DataTypes.INTEGER(11)
        },
        
        clg_passo: {
            type: DataTypes.INTEGER(11)
        },
        
        clg_nome: {
            type: DataTypes.STRING(15)
        },
        
        clg_texto_impresso: {
            type: DataTypes.STRING(115)
        },
        
        clg_texto_pos: {
            type: DataTypes.STRING
        },
        
        clg_mapa_id: {
            type: DataTypes.STRING(99)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign key

// tbl_classes_ingressos (cla_cod → cla_cod)
tbl_classes_ingressos.hasMany(tbl_classe_grupo, {
    foreignKey: 'cla_cod',
    sourceKey: 'cla_cod',
    onUpdate: 'restrict',
    onDelete: 'cascade',
    hooks: true
})
tbl_classe_grupo.belongsTo(tbl_classes_ingressos, {
    foreignKey: 'cla_cod',
    targetKey: 'cla_cod'
})

export default tbl_classe_grupo