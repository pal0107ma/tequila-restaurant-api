import Joi from "joi"

import idSchema from "../../schemas/idSchema.js"
import client from "../../db/redis.client.js"
import BranchOffice from "../../models/BranchOffice.js"
import Restaurant from "../../models/Restaurant.js"

async function updateBranchOffice (__, args, context) {
  const schema = Joi.object().keys({
    name: Joi.string().min(3).max(60).optional().empty(null),
    zone: Joi.string().min(3).max(60).optional().empty(null),
    city: Joi.string().min(3).max(60).optional().empty(null),
    address: Joi.string().min(3).max(100).optional().empty(null),
    state: Joi.string().min(3).max(60).optional().empty(null),
    country: Joi.string().min(2).max(2).optional().empty(null),
    zip: Joi.number().integer().optional().empty(null),
    id: idSchema
  })

  const {error, value: {id, ...input}} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  const restaurants = await Restaurant.find({ userId: context.user._id })

  let branchOffice = await BranchOffice.findOneAndUpdate({
    _id: id,
    restaurantId: {
      $in: restaurants.map(({_id}) => _id)
    }
  }, input)

  if(!branchOffice) return null

  branchOffice = JSON.stringify({...branchOffice._doc,...input})

  await client.del(`branch_offices:${id}`)

  await client.set(`branch_offices:${id}`, branchOffice,{
    EX: process.env.BRANCH_OFFICE_REDIS_EXP
      ? Number(process.env.BRANCH_OFFICE_REDIS_EXP)
      : 60 * 60 * 24,
    NX: true
  })

  branchOffice = JSON.parse(branchOffice)

  return branchOffice
}

export default updateBranchOffice