import { DataTypes } from 'sequelize'
import db_conn from './db_conn.js'


/**
 * Tabela dos Promotores
 */
const lltckt_manufacturer = db_conn.define(
    'lltckt_manufacturer',
    {
        manufacturer_id: {
            type: DataTypes.INTEGER(11),
            autoIncrement: true,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING(64)
        },

        image: {
            type: DataTypes.STRING(255)
        },

        sort_order: {
            type: DataTypes.INTEGER(3)
        },

        email: {
            type: DataTypes.STRING(50)
        },

        senha: {
            type: DataTypes.STRING(32)
        },

        telefone: {
            type: DataTypes.STRING(20)
        },

        endereco: {
            type: DataTypes.STRING(200)
        },

        bairro: {
            type: DataTypes.STRING(120)
        },

        idcidade: {
            type: DataTypes.INTEGER(11)
        },

        idestado: {
            type: DataTypes.INTEGER(11)
        },

        razaosocial: {
            type: DataTypes.STRING(200)
        },

        fantasia: {
            type: DataTypes.STRING(200)
        },

        cnpj: {
            type: DataTypes.STRING(14)
        },

        ie: {
            type: DataTypes.STRING(14)
        },

        status: {
            type: DataTypes.TINYINT(1)
        },

        datamodificacao: {
            type: DataTypes.DATE
        }
    }
)

export default lltckt_manufacturer