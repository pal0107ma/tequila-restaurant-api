import userProfile from './resolvers/users/userProfile.js'
import updateUser from './resolvers/users/updateUser.js'
import addRestaurant from './resolvers/restaurants/addRestaurant.js'
import restaurant from './resolvers/restaurants/restaurant.js'
import restaurants from './resolvers/restaurants/restaurants.js'
import updateRestaurant from './resolvers/restaurants/updateRestaurant.js'
import deleteRestaurant from './resolvers/restaurants/deleteRestaurant.js'
import addBranchOffice from './resolvers/branch-offices/addBranchOffice.js'
import deleteBranchOffice from './resolvers/branch-offices/deleteBranchOffice.js'
import userAssociated from './resolvers/users/userAssociated.js'
import branchOffice from './resolvers/branch-offices/branchOffice.js'
import branchOffices from './resolvers/branch-offices/branchOffices.js'
import updateBranchOffice from './resolvers/branch-offices/updateBranchOffice.js'

const resolvers = {
  User: {
    id: (parent) => parent.id ?? parent._id,
    associated: userAssociated
  },
  Restaurant: {
    id: (parent) => parent.id ?? parent._id,
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
    restaurants,
    branchOffices,
    branchOffice
  },
  Mutation: {
    updateUser,
    addRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addBranchOffice,
    deleteBranchOffice,
    updateBranchOffice
  }
}

export default resolvers
