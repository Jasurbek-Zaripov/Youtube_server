import express from 'express'
import cors from 'cors'
import { join } from 'path'
import rout from './src/controller/controller.js'
const PORT = process.env.PORT || 4000

const app = express()
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
)
app.use(express.static(join(process.cwd(), 'src', 'res')))
app.use(express.json())
app.use(rout)

app.listen(PORT, console.log('server running...'))
