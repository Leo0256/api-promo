import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela com os usuários que realizam
 * as sangrias
 */
const tbl_usuarios = db_conn.define(
    'tbl_usuarios',
    {
        usu_id: {
            type: DataTypes.INTEGER(60),
            autoIncrement: true,
            primaryKey: true
        },
        
        usu_empresa: {
            type: DataTypes.INTEGER(60)
        },
        
        usu_perfil: {
            type: DataTypes.STRING(60)
        },
        
        usu_nome: {
            type: DataTypes.STRING(60)
        },
        
        usu_email: {
            type: DataTypes.STRING(60)
        },

        usu_senha: {
            type: DataTypes.STRING(60)
        },

        usu_data_inclusao: {
            type: DataTypes.DATE
        },
        
        usu_login: {
            type: DataTypes.STRING(60)
        },

        usu_cliente: {
            type: DataTypes.INTEGER(60)
        }
    }
)

export default tbl_usuarios