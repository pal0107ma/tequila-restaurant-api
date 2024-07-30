import Joi from "joi"; // Import the Joi validation library
import idSchema from "../../schemas/idSchema.js"; // Import the ID validation schema

// Import the necessary models
import BranchOffice from "../../models/BranchOffice.js";
import Restaurant from "../../models/Restaurant.js";
import Order from "../../models/Order.js";

async function addOrder(_, args, context) {
  // Define the validation schema for the branch ID
  const schema = Joi.object().keys({
    branchId: idSchema.required(), // Make branchId required
  });

  // Validate the arguments against the schema
  const { error, value: { branchId } } = schema.validate(args);

  if (error) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: "BAD_USER_INPUT",
        details: error.details,
        http: { status: 400 },
      },
    });
  }

  // Find the branch by ID
  const branch = await BranchOffice.findById(branchId);

  if (!branch) {
    throw new GraphQLError("Branch not found", {
      extensions: {
        code: "BRANCH_NOT_FOUND",
        http: { status: 409 },
      },
    });
  }

  // Check if the user has access to the restaurant associated with the branch
  const restaurant = await Restaurant.findOne({
    userId: context.user._id,
    _id: branch.restaurantId,
  });

  if (!restaurant) {
    throw new GraphQLError("Access denied", {
      extensions: {
        code: "BRANCH_ACCESS_DENIED",
        http: { status: 403 },
      },
    });
  }

  // Create a new Order instance with the branch ID
  const order = new Order({ branchId });

  // Save the order to the database
  await order.save();

  // Return the created order object
  return JSON.parse(JSON.stringify(order))
}

export default addOrder;
