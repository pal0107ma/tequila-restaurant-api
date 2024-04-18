// REQUIRE MODULES
import express from 'express'

import cors from 'cors'

import auth from './routers/auth.js'
import graphql from './routers/graphql.js'
import verifyJWT from './middlewares/auth/verifyJWT.js'
import logger from 'morgan'

const app = express()

// MIDDLEWARES
app.use(express.json())

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'HEAD']
  })
)

app.use(logger('dev'))

// DEFINE ROUTES

app.use('/auth', auth)

app.use('/graphql', verifyJWT, graphql)

export default app
