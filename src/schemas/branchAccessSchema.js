import { Schema } from 'mongoose'

const branchAccessSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'branch_office'
  },
  branchRole: {
    type: [String],
    enum: ['CHEF','HR','STORER','COUNTER']
  },
})

export default branchAccessSchema
