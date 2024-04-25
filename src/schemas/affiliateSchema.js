import {Schema} from 'mongoose'

const affiliateSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  role: {
    type: String,
    enum: ['STORER', 'HR', 'COUNTER', 'CHEF'],
    required: true,
  }
},{
  versionKey:false,
  timestamps:true
})

export default affiliateSchema