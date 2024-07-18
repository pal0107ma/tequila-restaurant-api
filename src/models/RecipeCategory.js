import {Schema, model} from 'mongoose'

const recipeCategorySchema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
    uppercase: true
  },
  branchId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'branch_office'
  }
}, {
  versionKey: false
})

const RecipeCategory = model('recipe_category', recipeCategorySchema, 'recipe_categories')

export default RecipeCategory
