import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_pdvs from './tbl_pdvs.js'


/**
 * Tabela das maquininhas de crédito (POS)
 * 
 * foreign keys:
 * - tbl_pdvs (pos_pdv → pdv_id)
 */
const tbl_pos = db_conn.define(
    'tbl_pos',
    {
        pos_serie: {
            type: DataTypes.STRING(60),
            primaryKey: true
        },

        pos_modelo: {
            type: DataTypes.STRING(60)
        },

        pos_pdv: {
            type: DataTypes.INTEGER(60)
        },

        pos_operadora: {
            type: DataTypes.STRING(60)
        },

        pos_finalidade: {
            type: DataTypes.STRING(60)
        },

        pos_data_inclusao: {
            type: DataTypes.DATE
        },

        pos_numero_chip: {
            type: DataTypes.STRING(60)
        },

        pos_empresa: {
            type: DataTypes.INTEGER(60)
        },

        pos_posweb_key: {
            type: DataTypes.STRING(60)
        },

        pos_versao_navs: {
            type: DataTypes.STRING(60)
        },

        pos_versao_qi: {
            type: DataTypes.STRING(60)
        },

        pos_numero_celular: {
            type: DataTypes.STRING(60)
        },

        pos_tipo_conexao: {
            type: DataTypes.STRING(45)
        },

        pos_data_credito: {
            type: DataTypes.DATE
        },

        pos_ativacao_smart_card: {
            type: DataTypes.STRING(60)
        },

        pos_password: {
            type: DataTypes.STRING
        },

        pos_quantidade_parcela: {
            type: DataTypes.INTEGER(11)
        },

        pos_percentual_taxa: {
            type: DataTypes.DECIMAL(14,2)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

// tbl_pdvs (pos_pdv → pdv_id)
tbl_pdvs.hasMany(tbl_pos, {
    foreignKey: 'pos_pdv',
    sourceKey: 'pdv_id',
    hooks: true
})
tbl_pos.belongsTo(tbl_pdvs, {
    foreignKey: 'pos_pdv',
    targetKey: 'pdv_id'
})

export default tbl_pos