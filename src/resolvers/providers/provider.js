import Restaurant from "../../models/Restaurant.js"
import Provider from "../../models/Provider.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"

async function provider (__, {id}, context) {

  const {error} = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let provider = await client.get(`providers:${id}`)

  if(!provider) {

    provider = await Provider.findById(id)

    if(!provider) return null

    provider = JSON.stringify(provider)

    await client.set(`providers:${id}`, provider, {
      EX: process.env.PROVIDER_REDIS_EXP
        ? Number(process.env.PROVIDER_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })

  }

  provider = JSON.parse(provider)

  const restaurant = await Restaurant.findOne({
    _id: provider.restaurantId,
    userId: context.user._id
  })

  if(!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 }
      }
    })
  }
  
  return provider
}

export default provider