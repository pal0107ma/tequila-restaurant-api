import Joi from 'joi'
import { GraphQLError } from 'graphql'

// MODELS
import Restaurant from '../../models/Restaurant.js'

// JOI SCHEMAS
import idSchema from '../../schemas/idSchema.js'

// REDIS CLIENT
import client  from '../../db/redis.client.js'

async function deleteAffiliate(__, args, context) {

  // DEFINE VALIDATION SCHEMA
  const schema = Joi.object().keys({
    id: idSchema,
    branchOfficeId: idSchema,
    affiliateId: idSchema,
  })

  // VALIDATE USE INPUT
  const {error, value: { 
    id,
    branchOfficeId,
    affiliateId
  }} = schema.validate(args)

  // RETURN 400 ERROR
  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // FIND RESTAURANT BY ID AND USER ID AND BRANCH OFFICE ID 

  let restaurant = await Restaurant.findOne({
    _id:id, 
    userId: context.user._id, 
    'branchOffices._id': branchOfficeId,
  }).populate({ 
    path:'branchOffices.affiliates.userId',
    select: 'firstName lastName email'

  })

  // RETURN NULL
  if(!restaurant) return null

  // REMOVE AFFILIATE
  restaurant.branchOffices.id(branchOfficeId).affiliates.pull(affiliateId)

  await restaurant.save()

  // STORE TO REDIS
  restaurant = JSON.stringify(restaurant)

  await client.del(`restaurants:${id}`)

  await client.set(`restaurants:${id}`, restaurant)

  // RETURN RESTAURANT DATA 
  return JSON.parse(restaurant)

}

export default deleteAffiliate