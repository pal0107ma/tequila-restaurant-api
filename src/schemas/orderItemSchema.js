import { Schema } from "mongoose";

const orderItemSchema = new Schema({
  recipeId: {
    type: Schema.Types.ObjectId,
    ref: 'recipe',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true
  }
},{
  versionKey: false
})

export default orderItemSchema