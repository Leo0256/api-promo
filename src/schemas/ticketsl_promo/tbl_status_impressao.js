import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela de status de impressão
 */
const tbl_status_impressao = db_conn.define(
    'tbl_status_impressao',
    {
        simp_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        
        simp_descricao: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }
);

export default tbl_status_impressao