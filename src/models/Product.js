import {Schema, model} from 'mongoose'

const productSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'branch_office'
  },
  name: {
    type: String,
    required:true,
    trim:true
  },
  description: {
    type: String,
    required:true,
    trim:true
  },
  category: {
    type: Schema.Types.ObjectId,
    required:true,
    ref: 'product_category'
  },
  countableAmount: {
    type: Number,
    required: true
  },
  measureUnit: {
    type: String,
    default: null,
    enum:['OZ','LIB']
  },
  contentAmountWeight: {
    type: Number,
    required: true
  },
},{
  versionKey: false,
  timestamps:true 
})


const Product = model('product', productSchema)

export default Product