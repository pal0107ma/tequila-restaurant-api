import Restaurant from '../../models/Restaurant.js'
import idSchema from '../../schemas/idSchema.js'
import { GraphQLError } from 'graphql'

// REDIS CLIENT
import client  from '../../db/redis.client.js'

async function deleteRestaurant (__,{id},context) {

  const {error} = idSchema.validate()

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let restaurant = await Restaurant.findOneAndDelete({_id:id, userId: context.user._id})

  if(!restaurant) return null

  restaurant = JSON.stringify(restaurant)

  await client.del(`restaurants:${id}`)

  restaurant = JSON.parse(restaurant)

  return restaurant
}

export default deleteRestaurant