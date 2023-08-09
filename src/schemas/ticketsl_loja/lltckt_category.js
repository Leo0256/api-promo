import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela dos dados (categorias) dos Eventos na loja
 */
const lltckt_category = db_conn.define(
    'lltckt_category',
    {
        category_id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        image: {
            type: DataTypes.STRING(255)
        },

        parent_id: {
            type: DataTypes.INTEGER(11)
        },

        top: {
            type: DataTypes.TINYINT(1)
        },

        column: {
            type: DataTypes.INTEGER(3)
        },

        sort_order: {
            type: DataTypes.INTEGER(3)
        },

        status: {
            type: DataTypes.TINYINT(1)
        },

        date_added: {
            type: DataTypes.DATE
        },

        date_modified: {
            type: DataTypes.DATE
        },

        manufacturer_id: {
            type: DataTypes.INTEGER(11)
        },

        data_evento: {
            type: DataTypes.DATEONLY
        },

        local: {
            type: DataTypes.TEXT
        },

        local2: {
            type: DataTypes.TEXT
        },

        horaEvento: {
            type: DataTypes.STRING(5)
        },

        imageOutdoor: {
            type: DataTypes.STRING(255)
        },

        censura: {
            type: DataTypes.STRING(10)
        },

        horaAbertura: {
            type: DataTypes.STRING(5)
        },

        mapa: {
            type: DataTypes.STRING(250)
        },

        pontosVenda: {
            type: DataTypes.TEXT
        },

        data_fim_vendas: {
            type: DataTypes.DATE
        },

        eticket: {
            type: DataTypes.TINYINT(1)
        },

        facebook_pixel: {
            type: DataTypes.STRING(4000)
        },

        google_analytics: {
            type: DataTypes.STRING(4000)
        },

        data_fim_campanha: {
            type: DataTypes.DATE
        }
    },
    { schema: process.env.DB_LOJA }
)

export default lltckt_category