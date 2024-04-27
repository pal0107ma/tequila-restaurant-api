import { Schema } from "mongoose";

const modulesLimitSchema = new Schema({
  providers: {
    type: Number,
    default: 0
  },
  buy: {
    type: Number,
    default: 0
  },
  expenses: {
    type: Number,
    default: 0
  },
  payroll: {
    type: Number,
    default: 0
  },
  recipes: {
    type: Number,
    default: 0
  },
  reports: {
    type: Number,
    default: 0
  },
})

export default modulesLimitSchema