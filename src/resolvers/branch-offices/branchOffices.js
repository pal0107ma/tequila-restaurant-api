
import Joi from "joi"

import BranchOffice from "../../models/BranchOffice.js"
import idSchema from "../../schemas/idSchema.js"

async function branchOffices(__,args) {

  const schema = Joi.object().keys({
    restaurantId: idSchema,
    q: Joi.string().optional().trim().empty(""),
    offset: Joi.number().integer().optional().min(0).empty(null),
    count: Joi.number().integer().optional().min(5).empty(null),
    principal: Joi.any().valid(null, true, false).optional().default(null)
  })

  const {error, value:{q = '',offset = 0, restaurantId,principal, count= 10}} = schema.validate(args)

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  const search = {
    restaurantId
  }

  if(principal !== null) {
    search.principal = principal
  }

  if(q) {
    const regexp = new RegExp(q,'i')

    search.$or = [ 
      { name: regexp },
      { city: regexp },
      { country: regexp },
      { zone: regexp },
      { state: regexp },
      { address: regexp },
    ]    
  }

  let result = await BranchOffice.find(search).skip(offset).limit(count).sort({createdAt: 1}).populate({
    path: 'users', select: 'allowedBranches'
  })

  result = JSON.stringify(result)

  result = JSON.parse(result)

  return result
}
export default branchOffices