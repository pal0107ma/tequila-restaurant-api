import Restaurant from "../../models/Restaurant.js"
import Provider from "../../models/Provider.js"
import Joi from "joi"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"

async function addProvider (__, args, context) {

  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(60),
    phoneNr: Joi.string().min(6).max(30).optional().empty(),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] }
    }).optional().empty(null),
    restaurantId: idSchema
  })

  const {error, value: { restaurantId, ...input }} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    userId: context.user._id
  })

  if(!restaurant) {
    throw new GraphQLError('restaurant not  found or not allowed ', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  let provider = new Provider({restaurantId,...input})

  await provider.save()

  provider = JSON.stringify(provider)

  provider = JSON.parse(provider)

  return provider
}

export default addProvider