import Joi from 'joi'
import Restaurant from '../../models/Restaurant.js'
import {GraphQLError} from 'graphql'

async function restaurants (__,args, context ) {

  const schema = Joi.object().keys({
    q: Joi.string().optional().trim().empty(""),
    plan: Joi.string().optional().empty(null),
    status: Joi.string().optional().empty(null),
    offset: Joi.number().integer().optional().min(0).empty(null),
    count: Joi.number().integer().optional().min(5).empty(null),
  })

  const {error, value:{q = '',offset = 0, plan,status, count= 10}} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  const search = {}

  if(plan||status) {
    search.$and = []

   if(plan) search.$and.push({plan})

   if(status) search.$and.push({status})
  }

  if(context.user.userType === 'ADMIN') {
    if(search.$and) {

      search.$and.push({userId: context.user._id})
      
    } else search.$and = [{userId: context.user._id}]
  }

  if(q) {
    const regex = new RegExp(q)

    search.$or = [{name: regex}]
  }

  let result = await Restaurant.find(search).skip(offset).limit(count)

  result = JSON.stringify(result)

  return JSON.parse(result)
}

export default restaurants