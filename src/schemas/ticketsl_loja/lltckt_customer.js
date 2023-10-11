import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


const lltckt_customer = db_conn.define(
    'lltckt_customer',
    {
        customer_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        store_id: {
            type: DataTypes.INTEGER
        },

        firstname: {
            type: DataTypes.STRING(32)
        },

        lastname: {
            type: DataTypes.STRING(32)
        },

        email: {
            type: DataTypes.STRING(96)
        },

        telephone: {
            type: DataTypes.STRING(32)
        },

        fax: {
            type: DataTypes.STRING(32)
        },

        password: {
            type: DataTypes.STRING(40)
        },

        salt: {
            type: DataTypes.STRING(9)
        },

        cart: {
            type: DataTypes.TEXT
        },

        wishlist: {
            type: DataTypes.TEXT
        },

        newsletter: {
            type: DataTypes.TINYINT(1),
            defaultValue: 0
        },

        address_id: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        customer_group_id: {
            type: DataTypes.INTEGER
        },

        ip: {
            type: DataTypes.STRING(40)
        },

        status: {
            type: DataTypes.TINYINT(1)
        },

        approved: {
            type: DataTypes.TINYINT(1)
        },

        token: {
            type: DataTypes.STRING
        },

        date_added: {
            type: DataTypes.DATE
        },

        cpf: {
            type: DataTypes.STRING(11)
        },

        dataNascimento: {
            type: DataTypes.DATE
        },

        rg: {
            type: DataTypes.STRING(45)
        },

        sexo: {
            type: DataTypes.STRING(45)
        }
    },
    { schema: process.env.DB_LOJA }
)

export default lltckt_customer