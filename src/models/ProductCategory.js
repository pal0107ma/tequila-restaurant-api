import {Schema, model} from 'mongoose'


const productCategorySchema = new Schema({
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


const ProductCategory = model('product_category', productCategorySchema, 'product_categories')

export default ProductCategory
