import userProfile from './resolvers/users/userProfile.js'
import updateUser from './resolvers/users/updateUser.js'
import addRestaurant from './resolvers/restaurants/addRestaurant.js'
import restaurant from './resolvers/restaurants/restaurant.js'
import restaurants from './resolvers/restaurants/restaurants.js'
import updateRestaurant from './resolvers/restaurants/updateRestaurant.js'
import deleteRestaurant from './resolvers/restaurants/deleteRestaurant.js'
import addBranchOffice from './resolvers/branch-offices/addBranchOffice.js'
import deleteBranchOffice from './resolvers/branch-offices/deleteBranchOffice.js'
import addAffiliate from './resolvers/affiliate/addAffiliate.js'
import deleteAffiliate from './resolvers/affiliate/deleteAffiliate.js'

const resolvers = {
  User: {
    id: (parent) => parent.id ?? parent._id
  },
  Restaurant: {
    id: (parent) => parent.id ?? parent._id,
    branchOffice: (parent,{id}) => parent.branchOffices.find(({_id})=> _id === id) 
  },
  BranchOffice: {
    id: (parent) => parent.id ?? parent._id
  },
  Affiliate: {
    id: (parent) => parent.id ?? parent._id,
    user: (parent) => parent.userId
  },
  AffiliateUser: {
    id: (parent) => parent.id ?? parent._id
  },
  Query: {
    userProfile,
    restaurant,
    restaurants
  },
  Mutation: {
    updateUser,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addBranchOffice,
    deleteBranchOffice,
    addAffiliate,
    deleteAffiliate
  }
}

export default resolvers
