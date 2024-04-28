

import Joi from 'joi'
import { GraphQLError } from 'graphql'

// MODELS
import Restaurant from '../../models/Restaurant.js'
import BranchOffice from '../../models/BranchOffice.js'

async function addRestaurant (__,args, context) {

  // VALIDATE USER INPUT
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(60),
    plan: Joi.string(),
    status: Joi.string(),
    principalBranchOffice: Joi.object().keys({
      name: Joi.string().min(3).max(60),
      zone: Joi.string().min(3).max(60),
      city: Joi.string().min(3).max(60),
      address: Joi.string().min(3).max(100),
      state: Joi.string().min(3).max(60),
      country: Joi.string().min(2).max(2),
      zip: Joi.number().integer(),
    })
  })

  const {error, value: { principalBranchOffice, ...value }} = schema.validate(args)

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

  // DEFINE PRINCIPAL BRANCH OFFICE

  const branchOffice = new BranchOffice({ ...principalBranchOffice, principal: true, restaurantId: restaurant._id })

  // SAVE BRANCH OFFICE

  await branchOffice.save()

  // TO STRING

  restaurant = JSON.stringify(restaurant)

  // RETURN 

  return JSON.parse(restaurant)
  
}

export default addRestaurant