import userProfile from './resolvers/users/userProfile.js'
import updateUser from './resolvers/users/updateUser.js'
import addRestaurant from './resolvers/restaurants/addRestaurant.js'
import restaurant from './resolvers/restaurants/restaurant.js'
import restaurants from './resolvers/restaurants/restaurants.js'
import updateRestaurant from './resolvers/restaurants/updateRestaurant.js'
import deleteRestaurant from './resolvers/restaurants/deleteRestaurant.js'
const resolvers = {
  User: {
    id: (parent) => parent.id ?? parent._id
  },
  Restaurant: {
    id: (parent) => parent.id ?? parent._id
  },
  BranchOffice: {
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
    deleteRestaurant
  }
}

export default resolvers
