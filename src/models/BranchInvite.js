import {model, Schema} from 'mongoose'
import branchAccessSchema from '../schemas/branchAccessSchema.js'
import { v4 as uuidv4 } from 'uuid'

const branchInviteSchema = new Schema({
  branchId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  branchRole: {
    required: true,
    type: [String],
    enum: branchAccessSchema.obj.branchRole.enum
  },
  userEmail: {
    required: true,
    type:String,
    trim: true
  },
  t: {
    type: String,
    default: null
  }

}, {versionKey: false})

branchInviteSchema.pre('save', function () {
  if (this.t === null) {
   this.t = uuidv4()
  }
})

branchInviteSchema.pre('save', function (){
  this.branchRole = [...new Set(this.branchRole)]
})

const BranchInvite = model('branch_invite',branchInviteSchema)

export default BranchInvite