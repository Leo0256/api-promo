import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

import tbl_eventos from './tbl_eventos.js'


/**
 * Tabela das classes dos ingressos
 * 
 * foreign keys:
 * - tbl_eventos (cla_evento → eve_cod)
 */
const tbl_classes_ingressos = db_conn.define(
    'tbl_classes_ingressos',
    {
        cla_cod: {
            type: DataTypes.INTEGER(60),
            autoIncrement: true,
            primaryKey: true
        },

        cla_evento: {
            type: DataTypes.INTEGER(60)
        },

        cla_nome: {
            type: DataTypes.STRING(60)
        },

        cla_data_inclusao: {
            type: DataTypes.DATE
        },

        cla_empresa: {
            type: DataTypes.INTEGER(60)
        },

        cla_nome_pos: {
            type: DataTypes.STRING(60)
        },

        cla_valor_taxa: {
            type: DataTypes.DECIMAL(7,2)
        },

        cla_view_sts: {
            type: DataTypes.INTEGER(11)
        },

        cla_meia_inteira: {
            type: DataTypes.TINYINT(1)
        },

        cla_numeracao: {
            type: DataTypes.TINYINT(1)
        },

        cla_imp_lote: {
            type: DataTypes.TINYINT(1)
        },

        cla_imp_valor: {
            type: DataTypes.TINYINT(1)
        },

        cla_imp_taxa: {
            type: DataTypes.TINYINT(1)
        },

        cla_taxa_perc: {
            type: DataTypes.TINYINT(1)
        },

        cla_tipo: {
            type: DataTypes.INTEGER(1)
        },

        cla_qtde_mesa: {
            type: DataTypes.INTEGER(11)
        },

        cla_imp_data: {
            type: DataTypes.TINYINT(1)
        },

        cla_imp_hora: {
            type: DataTypes.TINYINT(1)
        },

        cla_imp_via: {
            type: DataTypes.TINYINT(1)
        },

        cla_imp_total: {
            type: DataTypes.TINYINT(1)
        },

        cla_frase: {
            type: DataTypes.STRING
        },

        cla_mapa_id: {
            type: DataTypes.STRING(99)
        },

        cla_setor: {
            type: DataTypes.INTEGER(11)
        },

        cla_categoria_id: {
            type: DataTypes.INTEGER(11)
        },

        cla_exibe_lote_atual: {
            type: DataTypes.TINYINT(1)
        }
    },
    { schema: process.env.DB_PROMO }
)

// foreign keys

//tbl_eventos (cla_evento → eve_cod)
tbl_eventos.hasMany(tbl_classes_ingressos, {
    foreignKey: 'cla_evento',
    sourceKey: 'eve_cod',
    hooks: true
})
tbl_classes_ingressos.belongsTo(tbl_eventos, {
    foreignKey: 'cla_evento',
    targetKey: 'eve_cod'
})

export default tbl_classes_ingressos