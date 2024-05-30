import { Schema } from "mongoose";

const modulesLimitSchema = new Schema({
  providers: {
    type: Number,
  },
  buy: {
    type: Number,
  },
  expenses: {
    type: Number,
  },
  payroll: {
    type: Number,
  },
  recipes: {
    type: Number,
  },
  reports: {
    type: Number,
  },
})

export default modulesLimitSchema