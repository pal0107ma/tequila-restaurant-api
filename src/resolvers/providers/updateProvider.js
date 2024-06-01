import Restaurant from "../../models/Restaurant.js"
import Provider from "../../models/Provider.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import client from "../../db/redis.client.js"

async function updateProvider (__, args, context) {

  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(60),
    phoneNr: Joi.string().min(6).max(30).optional().empty(),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] }
    }).optional().allow(null),
    id: idSchema
  })

  const {error, value: { id, ...input }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let provider =  await Provider.findById(id) 

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

  await Provider.findByIdAndUpdate(id, input)

  provider = JSON.stringify({...provider._doc,...input})

  await client.del(`providers:${id}`)

  await client.set(`providers:${id}`, provider,{
    EX: process.env.PROVIDER_REDIS_EXP
      ? Number(process.env.PROVIDER_REDIS_EXP)
      : 60 * 60 * 24,
    NX: true
  })

  provider = JSON.parse(provider)

  return provider
}

export default updateProvider