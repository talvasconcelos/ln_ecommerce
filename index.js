require('dotenv').config()
const { Keystone } = require('@keystonejs/keystone')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { AdminUIApp } = require('@keystonejs/app-admin-ui')
const { PasswordAuthStrategy } = require('@keystonejs/auth-password')
const { MongooseAdapter: Adapter } = require('@keystonejs/adapter-mongoose')

const {
  User,
  Product,
  Category,
  Order,
  Invoice,
  CartItem,
} = require('./lists/schema')

const PROJECT_NAME = 'sparkstore'
const adapterConfig = {
  mongoUri: process.env.DB_URI,
}

/**
 * You've got a new KeystoneJS Project! Things you might want to do next:
 * - Add adapter config options (See: https://keystonejs.com/keystonejs/adapter-mongoose/)
 * - Select configure access control and authentication (See: https://keystonejs.com/api/access-control)
 */

const keystone = new Keystone({
  adapter: new Adapter(adapterConfig),
  cookie: {
    secure: true,
  },
  cookieSecret: process.env.KEYSTONE_SECRET,
})

// keystone.extendGraphQLSchema({
//   types: [
//     {
//       type: 'type CartItemOutput { item: ID!, qty: Int! }',
//     },
//   ],
// })

keystone.createList('User', User)
keystone.createList('Category', Category)
keystone.createList('Product', Product)
keystone.createList('CartItem', CartItem)
keystone.createList('Order', Order)
keystone.createList('Invoice', Invoice)

const authStrategy = keystone.createAuthStrategy({
  type: PasswordAuthStrategy,
  list: 'User',
  config: {
    identityField: 'username', // default: 'email'
    secretField: 'password', // default: 'password'
  },
})

module.exports = {
  keystone,
  apps: [
    new GraphQLApp(),
    new AdminUIApp({
      name: PROJECT_NAME,
      authStrategy,
      enableDefaultRoute: true,
      isAccessAllowed: ({ authentication: { item: user, listKey: list } }) =>
        !!user && !!user.isAdmin,
    }),
  ],
  configureExpress: app => {
    app.set('trust proxy', true)
  },
}
