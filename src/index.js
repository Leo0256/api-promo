import express, { json, urlencoded } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()

// Definindo o serviço
const app = express()

// Porta de operação
const port = process.env.PORT ?? 3000

// Configurações do serviço
app.use(cors())
app.use(json())
app.use(urlencoded({ extended: true }))

// Usando as rotas definidas
import routes from './routes/index.js'
app.use('/', routes)

// Iniciando o serviço
app.listen(port, () => {
    console.log(`\n> { Executando na porta: ${port} }\n`)
})