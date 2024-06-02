
import { GraphQLError } from 'graphql'

import client from "../../db/redis.client.js"
import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"

async function branchOffice (__, { id }, context) {
  
  const {error} = idSchema.validate(id)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  let branchOffice = await client.get(`branch_offices:${id}`)

  if(!branchOffice) {

    branchOffice = await BranchOffice.findById(id).populate({
      path: 'users', select: 'allowedBranches'
    })

    if(!branchOffice) return null

    branchOffice = JSON.stringify(branchOffice)

    await client.set(`branch_offices:${id}`, branchOffice,{
      EX: process.env.BRANCH_OFFICE_REDIS_EXP
        ? Number(process.env.BRANCH_OFFICE_REDIS_EXP)
        : 60 * 60 * 24,
      NX: true
    })

  }

  branchOffice = JSON.parse(branchOffice)

  return branchOffice
}

export default branchOffice