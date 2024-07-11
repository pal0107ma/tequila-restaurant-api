import Joi from "joi"; // Import Joi for validation
import BranchInvite from "../../models/BranchInvite.js"; // Import BranchInvite model
import User from "../../models/User.js"; // Import User model
import BranchOffice from "../../models/BranchOffice.js"; // Import BranchOffice model
import idSchema from "../../schemas/idSchema.js"; // Import idSchema for ID validation
import Restaurant from "../../models/Restaurant.js"; // Import Restaurant model
import sendEmail from "../../helpers/sendEmail.js"; // Import sendEmail function
import { GraphQLError } from "graphql"; // Import GraphQLError for error handling

/**
 * Function to add a branch invite for a user to a specific branch
 * 
 * @param {object} _ - Root object (unused in this context)
 * @param {object} args - Arguments containing branch ID, user email, branch role(s), and category IDs
 * @param {object} context - Context object containing user information
 * @returns {Promise<object>} Resolves with a JSON representation of the updated branch
 * @throws {GraphQLError} Throws a GraphQLError with appropriate codes and details on validation errors, access issues, or existing invitations
 */
async function addBranchInvite(_, args, context) {
  // Define validation schema for input arguments
  const schema = Joi.object().keys({
    branchId: idSchema.required(), // Branch ID is required
    userEmail: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net'] }
    }).required(), // User email is required and must be a valid email
    branchRole: Joi.array().items(Joi.string()).min(1).required(), // Branch role(s) are required and must be an array of strings
    categoriesId: Joi.array().items(idSchema).min(1).required() // Category IDs are required and must be an array of valid IDs
  });

  // Validate arguments against the schema
  const { error, value: { branchId, userEmail, ...input } } = schema.validate(args);

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        details: error.details,
        http: { status: 400 }
      }
    });
  }

  // Find the branch by ID
  let branch = await BranchOffice.findById(branchId);

  if (!branch) {
    throw new GraphQLError('Branch was not found', {
      extensions: {
        code: 'BRANCH_NOT_FOUND',
        http: { status: 409 }
      }
    });
  }

  // Verify that the user has access to the restaurant associated with the branch
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId
  });

  if (!restaurant) {
    throw new GraphQLError('Access denied', {
      extensions: {
        code: 'BRANCH_ACCESS_DENIED',
        http: { status: 403 }
      }
    });
  }

  // Prevent users from inviting themselves
  if (userEmail === context.user.email) {
    throw new GraphQLError('You cannot add yourself', {
      extensions: {
        code: 'USER_ALREADY_ADMIN',
        http: { status: 409 }
      }
    });
  }

  // Find the user by email
  const user = await User.findOne({ email: userEmail, 'allowedBranches.branchId': branchId });

  // Check if the user already has access to the branch
  if (user) {
      throw new GraphQLError('User already enrolled in this branch', {
        extensions: {
          code: 'USER_ALREADY_IN_BRANCH', 
          http: { status: 409 }
        }
      });
  }

  // Clean up any existing branch invite for the user and branch
  await BranchInvite.findOneAndDelete({ userEmail, branchId });


   // Create a new branch invite
   const branchInvite = new BranchInvite({
    branchId,
    userEmail,
    ...input, // Include additional invitation details from input
  });

  await branchInvite.save();

  // Send invitation email (implementation details omitted)
  await sendEmail({
    htmlParams: {
      HREF: `${process.env.FRONTEND_URL}/confirm-branch-invite?t=${branchInvite.t}`,
      TITLE: 'You were invited to a branch!', 
      LINK_TEXT: 'Click here to accept!', 
      TEXT: `"${restaurant.name}" invited you to administrate "${branch.name}" branch. Click "Click here to accept!" if you agree to join.`
    },
    to: [userEmail],
    subject: 'Invitation to Join Branch' 
  });

  // Return information about the branch (optional, customize as needed)
  return JSON.parse(JSON.stringify(branch));
}

export default addBranchInvite;