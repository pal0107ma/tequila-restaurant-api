import Joi from "joi";
import BranchInvite from "../../models/BranchInvite.js";
import User from "../../models/User.js";
import BranchOffice from "../../models/BranchOffice.js";
import idSchema from "../../schemas/idSchema.js";
import Restaurant from "../../models/Restaurant.js";
import sendEmail from "../../helpers/sendEmail.js";
import { GraphQLError } from "graphql";

async function addBranchInvite (__, args, context){

  const schema = Joi.object().keys({
    branchId: idSchema,
    userEmail: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] }
    }),
    branchRole: Joi.array().items(Joi.string()).min(1),
    categoriesId: Joi.array().items(idSchema).min(1),
  })

  const {error, value:{branchId, userEmail, ...input}} = schema.validate(args)

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

  let branch = await BranchOffice.findOne({ 
    _id: branchId, 
    restaurantId: {
      $in: restaurants.map(({_id}) => _id)
    }
  }).populate({path: 'restaurantId', select: 'name'})

  if (!branch) {
    throw new GraphQLError('branch was not found or not allowed', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 404 }
      }
    })
  }

  if(userEmail === context.user.email) {
    throw new GraphQLError('you cannot add yourself', {
      extensions: {
        code: 'BAD_USER_INPUT',
        http: { status: 409 }
      }
    })
  }

  const user = await User.findOne({email: userEmail})

  if(user) {

    const branch = user.allowedBranches.find((branchAccess)=> String(branchAccess.branchId) === branchId)

    // IS ALREADY ENROLLED
    if(branch) {
      throw new GraphQLError('user already enrolled', {
        extensions: {
          code: 'BAD_USER_INPUT',
          http: { status: 409 }
        }
      })
    }
  }

  // CREATE BRANCH INVITE
  await BranchInvite.findOneAndDelete({userEmail, branchId})

  const branchInvite = new BranchInvite({
    branchId, 
    userEmail,
    ...input
  })

  await branchInvite.save()

  // SEND EMAIL

  await sendEmail({
    htmlParams: {
      HREF: `${
        process.env.FRONTEND_URL
      }/confirm-branch-invite?t=${branchInvite.t}`,
      TITLE: 'You were invited to a branch',
      LINK_TEXT: 'Click here!',
      TEXT: `"${branch.restaurantId.name}" want you to administrate "${branch.name}" branch. So we need you confirm if you agree. So let\'s press "Click here!" if you agree.`
    },
    to: [userEmail],
    subject: 'You were invited to a branch'
  })

  branch = JSON.stringify(branch)

  branch = (({restaurantId:{_id: restaurantId}, ...rest})=> {
    return {restaurantId, ...rest}
  })(JSON.parse(branch))

  return branch
}

export default addBranchInvite