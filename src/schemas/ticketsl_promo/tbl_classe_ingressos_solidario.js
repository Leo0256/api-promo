import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_classes_ingressos from './tbl_classes_ingressos.js'


/**
 * Tabela dos ingressos solidários
 * 
 * foreign key:
 * - tbl_classes_ingressos (cis_cod_classe_ingresso → cla_cod)
 */
const tbl_classe_ingressos_solidario = db_conn.define(
    'tbl_classe_ingressos_solidario',
    {
        cis_cod: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },
        
        cis_product_id: {
            type: DataTypes.INTEGER(11)
        },
        
        cis_cod_classe_ingresso: {
            type: DataTypes.INTEGER(11)
        },
        
        cis_nome: {
            type: DataTypes.STRING
        },
        
        cis_valor: {
            type: DataTypes.FLOAT
        },
        
        cis_quantidade: {
            type: DataTypes.INTEGER(11)
        },
        
        cis_observacao: {
            type: DataTypes.STRING
        },
        
        cis_percentual: {
            type: DataTypes.FLOAT
        },
        
        cis_percentual_desconto: {
            type: DataTypes.FLOAT
        },
        
        cis_exibe_site: {
            type: DataTypes.INTEGER(11)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

// tbl_classes_ingressos (cis_cod_classe_ingresso → cla_cod)
const tbl_classes_ingressos_options = {
    foreignKey: 'cis_cod_classe_ingresso',
    sourceKey: 'cla_cod',
    onUpdate: 'set null',
    onDelete: 'set null',
    hooks: true
}

tbl_classes_ingressos.hasMany(tbl_classe_ingressos_solidario, {
    ...tbl_classes_ingressos_options
})
tbl_classes_ingressos.hasMany(tbl_classe_ingressos_solidario, {
    ...tbl_classes_ingressos_options,
    as: 'solidarios'
})
tbl_classe_ingressos_solidario.belongsTo(tbl_classes_ingressos, {
    foreignKey: 'cis_cod_classe_ingresso',
    targetKey: 'cla_cod'
})

export default tbl_classe_ingressos_solidario