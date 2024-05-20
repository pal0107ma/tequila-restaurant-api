import {Schema, model} from 'mongoose'

const productSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
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
    type: String,
    required:true,
    trim:true
  },
  countableAmount: {
    type: Number,
    required: true
  },
  measureUnits: {
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