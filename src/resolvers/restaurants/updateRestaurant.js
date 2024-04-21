import Joi from 'joi'
import { GraphQLError } from 'graphql'

import Restaurant from '../../models/Restaurant.js'

// JOI SCHEMAS
import idSchema from '../../schemas/idSchema.js'

// REDIS CLIENT
import client  from '../../db/redis.client.js'

async function updateRestaurant (__,args, context) {

  // VALIDATE USER INPUT
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(60).optional().empty(null),
    plan: Joi.string().optional().empty(null),
    status: Joi.string().optional().empty(null),
    id: idSchema,
    branchOffices: Joi.array().items(Joi.object().keys({
      name: Joi.string().min(3).max(60).optional().empty(null),
      zone: Joi.string().min(3).max(60).optional().empty(null),
      city: Joi.string().min(3).max(60).optional().empty(null),
      address: Joi.string().min(3).max(100).optional().empty(null),
      state: Joi.string().min(3).max(60).optional().empty(null),
      zip: Joi.number().integer().optional().empty(null),
      id: idSchema
    })).optional().empty(null)
  })

  const {error, value: {id,branchOffices,...updateInput}} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let restaurant = await Restaurant.findOneAndUpdate({_id:id, userId: context.user._id}, updateInput)

  if(!restaurant) return null

  if(branchOffices?.length) {
    branchOffices.forEach(({id,...input}) => {
      const branchOffice = restaurant.branchOffices.id(id)

      if(!branchOffice) return

      const inputEntries = Object.entries(input)

      inputEntries.forEach(([key, value]) => {
        branchOffice[key] = value
      });
    });

    await restaurant.save()
  }

  restaurant = JSON.stringify({...restaurant._doc,...updateInput})

  await client.del(`restaurants:${id}`)

  await client.set(`restaurants:${id}`, restaurant)

  return JSON.parse(restaurant)
}

export default updateRestaurant