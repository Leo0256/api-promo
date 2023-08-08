import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'

/**
 * Tabela dos usuários Admin
 */
const lltckt_user = db_conn.define(
    'lltckt_user',
    {
        user_id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        user_group_id: {
            type: DataTypes.INTEGER(11)
        },

        username: {
            type: DataTypes.STRING(20)
        },

        password:{
            type: DataTypes.STRING(40)
        },

        salt: {
            type: DataTypes.STRING(9)
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

        code: {
            type: DataTypes.STRING(32)
        },

        ip: {
            type: DataTypes.STRING(40)
        },

        status: {
            type: DataTypes.TINYINT(1)
        },

        date_added: {
            type: DataTypes.DATE
        }
    }
)

export default lltckt_user