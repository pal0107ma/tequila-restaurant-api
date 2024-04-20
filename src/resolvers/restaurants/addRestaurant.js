

import Joi from 'joi'
import { GraphQLError } from 'graphql'

// MODELS
import Restaurant from '../../models/Restaurant.js'

async function addRestaurant (__,args, context) {

  // VALIDATE USER INPUT
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(60),
    plan: Joi.string(),
    status: Joi.string()
  })

  const {error, value} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // DEFINE RESTAURANT

  let restaurant = new Restaurant({...value, userId: context.user._id})

  // SAVE RESTAURANT

  await restaurant.save()

  // TO STRING

  restaurant = JSON.stringify(restaurant)

  // RETURN 

  return JSON.parse(restaurant)
  
}

export default addRestaurant