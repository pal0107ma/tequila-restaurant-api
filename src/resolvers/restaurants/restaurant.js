

import { GraphQLError } from 'graphql'

// REDIS CLIENT
import client  from '../../db/redis.client.js'

// JOI SCHEMAS
import idSchema from '../../schemas/idSchema.js'
import Restaurant from '../../models/Restaurant.js'


async function restaurant (__, {id}) {

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

  let restaurant = await client.get(`restaurants:${id}`)

  // WHEN WAS NOT FOUND IN REDIS
  if(!restaurant) {
    restaurant = await Restaurant.findById(id).populate({ 
      path:'branchOffices.affiliates.userId',
    select: 'firstName lastName email'
  })

    // WHEN WAS NOT FOUND IN DB
    if(!restaurant) return null

    // SEVE TO REDIS

    restaurant = JSON.stringify(restaurant)

    await client.set(`restaurants:${id}`,restaurant,{
      EX: process.env.RESTAURANT_REDIS_EXP
        ? Number(process.env.RESTAURANT_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })
  }


  return JSON.parse(restaurant)
}

export default restaurant