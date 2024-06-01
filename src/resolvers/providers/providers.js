import Restaurant from "../../models/Restaurant.js"
import Provider from "../../models/Provider.js"
import idSchema from "../../schemas/idSchema.js"
import { GraphQLError } from "graphql"
import Joi from "joi"

async function providers(__, args, context){

   // VALIDATE ARGS
   const schema = Joi.object().keys({
    restaurantId: idSchema,
    q: Joi.string().trim().optional().empty(""),
    count: Joi.number().integer().max(100).min(5).default(10),
    offset: Joi.number().integer().min(0).default(0),
  })

  const {error, value:{restaurantId,q,offset, count}} = schema.validate(args)

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

  const search = { restaurantId }

  if(q) {
    const regex = new RegExp(q)

    search.$or = [
      {name: regex},
      {desc: regex},
    ]
  }

  let result = await Provider.find(search).skip(offset).limit(count)

  result = JSON.stringify(result)

  return JSON.parse(result)

}

export default providers