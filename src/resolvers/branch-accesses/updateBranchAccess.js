import Restaurant from "../../models/Restaurant.js";
import User from "../../models/User.js";
import BranchOffice from "../../models/BranchOffice.js";
import idSchema from "../../schemas/idSchema.js";
import client from "../../db/redis.client.js";
import Joi from "joi";
import { GraphQLError } from 'graphql'

async function updateBranchAccess (__, args, context) {

  const schema = Joi.object().keys({
    id: idSchema,
    branchRole: Joi.array().items(Joi.string()).min(1).optional().empty(null),
    categoriesId: Joi.array().items(idSchema).min(1).optional().empty(null)
  })

  const {error, value: { branchRole, id,categoriesId}} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let user = await User.findOne({
    'allowedBranches._id': id
  }, 
    ).select('-confirmedAccount -password -tokens')

  if(!user) return null

  const branchOffice = await BranchOffice.findById(user.allowedBranches.id(id).branchId)

 const restaurant = await Restaurant.findOne({ userId: context.user._id, _id: branchOffice.restaurantId })

  if(!restaurant) {
    throw new GraphQLError('access denied', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 403 }
      }
    })
  }

  if(branchRole || categoriesId) {
    if(branchRole) user.allowedBranches.id(id).branchRole = branchRole
    if(categoriesId) user.allowedBranches.id(id).categoriesId = categoriesId

    await client.del(`branch_offices:${user.allowedBranches.id(id).branchId}`)

    await user.save()

    const userId = user._id

    user = JSON.stringify(user)

    // UPDATE IN REDIS
    await client.del(`users:${userId}`)

    await client.set(`users:${userId}`, user, {
      EX: process.env.USER_REDIS_EXP
        ? Number(process.env.USER_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })
  } else user = JSON.stringify(user)

  user = JSON.parse(user)

  return user
}

export default updateBranchAccess