import Restaurant from "../../models/Restaurant.js"
import Provider from "../../models/Provider.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"

async function deleteProvider (__, {id}, context) {

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


  let provider = await Provider.findById(id)

  if(!provider) return null

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

  await Provider.findByIdAndDelete(id)

  await client.del(`providers:${id}`)

  provider = JSON.stringify(provider)
  
  provider = JSON.parse(provider)

  return provider
}

export default deleteProvider