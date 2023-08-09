import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela dos eventos
 */
const tbl_eventos = db_conn.define(
    'tbl_eventos',
    {
        eve_cod: {
            type: DataTypes.INTEGER(60),
            autoIncrement: true,
            primaryKey: true
        },

        eve_nome: {
            type: DataTypes.STRING(60)
        },

        eve_local: {
            type: DataTypes.STRING(60)
        },

        eve_inicio: {
            type: DataTypes.DATE
        },

        eve_fim: {
            type: DataTypes.DATE
        },

        eve_fim_sangria: {
            type: DataTypes.DATE
        },

        eve_frase: {
            type: DataTypes.STRING
        },

        eve_data_inclusao: {
            type: DataTypes.DATE
        },

        eve_cidade: {
            type: DataTypes.STRING(60)
        },

        eve_data: {
            type: DataTypes.DATE
        },

        eve_hora: {
            type: DataTypes.TIME
        },

        eve_empresa: {
            type: DataTypes.INTEGER(60)
        },

        eve_cliente: {
            type: DataTypes.INTEGER(60)
        },

        eve_print_via: {
            type: DataTypes.SMALLINT(2)
        },

        eve_ativo: {
            type: DataTypes.TINYINT(4)
        },

        eve_nome_pos: {
            type: DataTypes.STRING(60)
        },

        eve_taxa: {
            type: DataTypes.SMALLINT(2)
        },

        eve_logo: {
            type: DataTypes.STRING(300)
        },

        eve_mapa: {
            type: DataTypes.STRING
        },

        eve_pin_validacao: {
            type: DataTypes.STRING(8)
        },

        eve_taxa_valor: {
            type: DataTypes.DECIMAL(7,2),
            defaultValue: 0.0
        }
    },
    { schema: process.env.DB_PROMO }
)

export default tbl_eventos