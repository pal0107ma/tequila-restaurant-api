import { Schema } from 'mongoose'

const branchAccessSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    ref: 'branch_office'
  },
  branchRole: {
    type: [String],
    enum: ['CHEF','HR','STORER']
  },
  categoriesId: {
    type: [Schema.Types.ObjectId],
    ref: 'product_category'
  }
})

branchAccessSchema.pre('save', function () {
  this.branchRole = [...new Set(this.branchRole)]
})

export default branchAccessSchema
