import { Schema } from 'mongoose'

const paymentDetailsSchema = new Schema({
  paymentMethod: {
    type: String,
    required: true,
    enum: ['PAYPAL','STRIPE']
  },
  txId: {
    type: String,
    required: true,
  }
},{
  timestamps: {
    createdAt: 'timestamp',
    updatedAt: false
  }
})

export default paymentDetailsSchema