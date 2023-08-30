import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela com os meios de pagamento
 */
const tbl_meio_pgto = db_conn.define(
    'tbl_meio_pgto',
    {
        mpg_codigo: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            primaryKey: true
        },

        mpg_nome: {
            type: DataTypes.STRING(10)
        }
    },
    { schema: process.env.DB_PROMO }
)

export default tbl_meio_pgto