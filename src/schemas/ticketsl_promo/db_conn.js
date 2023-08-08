// Conecta o banco 'ticketsl_promo' com a API pelo Sequelize

import {
    Sequelize,
    Op,
    cast,
    col
} from 'sequelize';
import dotenv from 'dotenv'
dotenv.config()

const operatorsAliases = {
    $or: Op.or,
    $like: Op.like,
    $not: Op.not,
    $in: Op.in,
    $cast: cast,
    $col: col
}

// Conexão com o banco
const ticketsl_promo = new Sequelize({
    database: process.env.DB_PROMO,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    define: {
        freezeTableName: true,
        timestamps: false
    },
    timezone: '-03:00', // timezone GMT-3 de Brasília
    operatorsAliases: operatorsAliases
})

ticketsl_promo.dialect.supports.schemas = true
ticketsl_promo.authenticate()
.then(() => {
    console.log('\n> Conectado ao banco: ticketsl_promo\n')
})
.catch(e => {
    console.log('\n> Falha ao conectar ao banco: ticketsl_promo\n')
    console.error(e)
})

export default ticketsl_promo