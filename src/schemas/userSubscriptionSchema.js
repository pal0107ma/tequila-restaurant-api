import { Schema } from 'mongoose'
import paymentDetailsSchema from './paymentDetailsSchema.js'

const userSubscriptionSchema = new Schema({
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'subscription'
  },
	cycle: {
		type: String,
		enum: ['YEARLY','MONTHLY','QUARTERLY']
	},
	paymentDetails: {
		type: paymentDetailsSchema
	}
},{
  timestamps: {
    createdAt: 'datePurchased',
		updatedAt: false
  }
})

export default userSubscriptionSchema
