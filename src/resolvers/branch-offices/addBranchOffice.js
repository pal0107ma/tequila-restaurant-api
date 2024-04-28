import Joi from 'joi'
import { GraphQLError } from 'graphql'
import client  from '../../db/redis.client.js'

// MODELS
import Restaurant from '../../models/Restaurant.js'
import BranchOffice from '../../models/BranchOffice.js'

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
    restaurantId: idSchema
  })

  const {error, value:{ restaurantId, ...userInput }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let restaurant = await Restaurant.findOne({
    _id: restaurantId,
    userId: context.user._id
  })

  if (!restaurant) {
    throw new GraphQLError('restaurant was not found', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  let branchOffice = new BranchOffice({ restaurantId, ...userInput })

  await branchOffice.save()

  branchOffice = JSON.stringify(branchOffice)

  return JSON.parse(branchOffice)
}

export default addBranchOffice