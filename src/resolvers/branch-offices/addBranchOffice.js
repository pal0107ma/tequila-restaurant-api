import Joi from 'joi'
import { GraphQLError } from 'graphql'
import client  from '../../db/redis.client.js'

// MODELS
import Restaurant from '../../models/Restaurant.js'

// JOI SCHEMAS
import idSchema from '../../schemas/idSchema.js'

async function addBranchOffice(__, args, context) {
  // VALIDATE USER INPUT
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(60),
    zone: Joi.string().min(3).max(60),
    city: Joi.string().min(3).max(60),
    address: Joi.string().min(3).max(100),
    state: Joi.string().min(3).max(60),
    country: Joi.string().min(2).max(2),
    zip: Joi.number().integer(),
    id: idSchema
  })

  const {error, value:{id: restaurantId,...input }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let restaurant = await Restaurant.findOne({_id: restaurantId,userId:context.user._id}).populate({ 
    path:'branchOffices.affiliates.userId',
    select: 'firstName lastName email'
  })

  if(!restaurant) return null

  restaurant.branchOffices.push(input)

  await restaurant.save()

  restaurant = JSON.stringify(restaurant)

  await client.del(`restaurants:${restaurantId}`)

  await client.set(`restaurants:${restaurantId}`, restaurant)

  return JSON.parse(restaurant)
}

export default addBranchOffice