
import { readFileSync } from 'fs'
import { resolve } from 'path'
import gql from 'graphql-tag'

const typeDefs = gql(
  readFileSync(resolve('src/schema.graphql'), {
    encoding: 'utf-8'
  })
)

export const restaurantPlanEnum = typeDefs.definitions
  .find(({ name: { value } }) => value === "restaurantPlanEnum")
  .values.map(({ name: { value } }) => {
    return value;
  });

export const restaurantStatusEnum = typeDefs.definitions
  .find(({ name: { value } }) => value === "restaurantStatusEnum")
  .values.map(({ name: { value } }) => {
    return value;
  });
