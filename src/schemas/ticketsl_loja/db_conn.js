// Conecta o banco 'ticketsl_loja' com a API pelo Sequelize

import {
    Sequelize,
    Op,
} from 'sequelize'

const operatorsAliases = {
    $or: Op.or,
    $like: Op.like,
    $not: Op.not,
    $in: Op.in,
    $gt: Op.gt,
    $gte: Op.gte,
    $lt: Op.lt,
    $lte: Op.lte
}

// Conexão com o banco
const ticketsl_loja = new Sequelize({
    database: process.env.DB_LOJA,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    define: {
        freezeTableName: true,
        timestamps: false
    },
    pool: {
        max: 3,
        min: 0,
        acquire: 3000,
        evict: 1000,
        idle: 0
    },
    timezone: '-03:00', // timezone GMT-3 de Brasília
    operatorsAliases: operatorsAliases
})

ticketsl_loja.dialect.supports.schemas = true
ticketsl_loja.authenticate()
.then(() => {
    console.log('\n> Conectado ao banco: ticketsl_loja\n')
})
.catch(e => {
    console.log('\n> Falha ao conectar ao banco: ticketsl_loja\n')
    console.error(e)
})

export default ticketsl_loja