import Joi from 'joi'
import { GraphQLError } from 'graphql'

// MODELS
import Restaurant from '../../models/Restaurant.js'
import User from '../../models/User.js'

// JOI SCHEMAS
import idSchema from '../../schemas/idSchema.js'

// REDIS CLIENT
import client  from '../../db/redis.client.js'

async function addAffiliate(__,args, context) {

  // DEFINE VALIDATION SCHEMA
  const schema = Joi.object().keys({
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] }
    }),
    id: idSchema,
    branchOfficeId: idSchema,
    role: Joi.string()
  })

  // VALIDATE USE INPUT
  const {error, value: { 
    id,
    email,
    branchOfficeId,
    role
  }} = schema.validate(args)

  // RETURN 400 ERROR
  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    })
  }

  // FIN USER BY EMAIL

  const user = await User.findOne({email: {
    $in: [email],
    $nin: [context.user.email]
  }})

  // RETURN 404 ERROR
  // _ USER WAS NOT FOUND BY EMAIL
  if(!user) {
    throw new GraphQLError(`user email "${email}" not in use`, {
      extensions: {
        code: 'USER_NOT_FOUND',
        http: { status: 404 }
      }
    })
  }

  // FIND RESTAURANT BY ID AND USER ID AND BRANCH OFFICE ID

  let restaurant = await Restaurant.findOne({
    _id:id, 
    userId: context.user._id, 
    'branchOffices._id': branchOfficeId
  })

  // RETURN NULL
  if(!restaurant) return null

  // GET BRANCH OFFICE
  const branchOffice = restaurant.branchOffices.id(branchOfficeId)

  // PREVENT AFFILIATES DUPLICATIONS 
  const affiliate = branchOffice.affiliates.find(({ userId }) => 
    String(userId) === String(user._id)
  ) 

  // IF USER ID IS NOT DUPLICATED
  // ADD AN AFFILIATE TO BRACH OFFICE
  if(!affiliate) {

    branchOffice.affiliates.push({
      userId: user._id,
      role
    })

  }

  await restaurant.save()

  await restaurant.populate({ 
    path:'branchOffices.affiliates.userId',
    select: 'firstName lastName email'
  })

  // STORE TO REDIS
  restaurant = JSON.stringify(restaurant)

  await client.del(`restaurants:${id}`)

  await client.set(`restaurants:${id}`, restaurant)

  // RETURN RESTAURANT DATA 
  return JSON.parse(restaurant)

}

export default addAffiliate