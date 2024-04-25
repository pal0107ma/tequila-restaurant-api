import Joi from 'joi'
import { GraphQLError } from 'graphql'
import client  from '../../db/redis.client.js'

// MODELS
import Restaurant from '../../models/Restaurant.js'

// JOI SCHEMAS
import idSchema from '../../schemas/idSchema.js'

async function deleteBranchOffice (__,args,context) {

  const schema = Joi.object().keys({
    id: idSchema,
    restaurantId: idSchema
  })

  const {error, value:{id,restaurantId}} = schema.validate(args)

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

  restaurant.branchOffices.pull(id)

  await restaurant.save()

  restaurant = JSON.stringify(restaurant)

  await client.del(`restaurants:${restaurantId}`)

  await client.set(`restaurants:${restaurantId}`, restaurant)

  return JSON.parse(restaurant)
}

export default deleteBranchOffice