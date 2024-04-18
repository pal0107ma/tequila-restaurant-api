import gql from 'graphql-tag'

import { ApolloServer } from '@apollo/server'

import { buildSubgraphSchema } from '@apollo/subgraph'

import { expressMiddleware } from '@apollo/server/express4'

import resolvers from '../resolvers.js'

import { readFileSync } from 'fs'
import { resolve } from 'path'

const typeDefs = gql(
  readFileSync(resolve('src/schema.graphql'), {
    encoding: 'utf-8'
  })
)

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
})

await server.start()

export default expressMiddleware(server, {
  context: ({ req, res }) => req.context
})
