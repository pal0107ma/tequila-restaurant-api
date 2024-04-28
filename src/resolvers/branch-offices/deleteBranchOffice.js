import Joi from 'joi'
import { GraphQLError } from 'graphql'
import client  from '../../db/redis.client.js'

// MODELS
import BranchOffice from '../../models/BranchOffice.js'
import Restaurant from '../../models/Restaurant.js'

// JOI SCHEMAS
import idSchema from '../../schemas/idSchema.js'

async function deleteBranchOffice (__,{ id },context) {

  const { error } = idSchema.validate(id)

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

  const branchOffice = await BranchOffice.findOneAndDelete({
    _id: id, 
    restaurantId: {
      $in: restaurants.map(({_id}) => _id)
    },
    principal: false
  })

  if(!branchOffice) return null

  await client.del(`branch_offices:${id}`)

  return JSON.parse(JSON.stringify(branchOffice))
}

export default deleteBranchOffice