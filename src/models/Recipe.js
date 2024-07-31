import {Schema, model} from 'mongoose'
import recipeItemSchema from '../schemas/recipeItemSchema.js'

const recipeSchema = new Schema({
  name:{
    type: String,
    trim: true,
    required: true,
  },
  description:{
    type: String,
    trim: true,
    required: true,
  },
  items: {
      type: [recipeItemSchema],
  },
  branchId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'branch_office'
  },
  category: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'recipe_category'
  },
  portions: {
    type: Number,
    default: 1
  }
},{
    timestamps: true,
    versionKey: false
})

const Recipe = model('recipe', recipeSchema)

export default Recipe