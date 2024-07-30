import {model, Schema} from 'mongoose'
import orderItemSchema from '../schemas/orderItemSchema.js'

const orderSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'branch_office',
    required: true
  },
  items: {
    type: [orderItemSchema]
  }
}, {
  versionKey: false,
  timestamps: true
})

const Order = model('order',orderSchema)

export default Order