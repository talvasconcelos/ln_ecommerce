const { Select, Relationship } = require('@keystonejs/fields')

module.exports = {
  fields: {
    cart: { type: Relationship, ref: 'Product', many: true },
    settled: { type: Select, options: 'true, false', defaultValue: 'false' },
    status: {
      type: Select,
      options: 'pending, processed, shipped',
      defaultValue: 'pending',
    },
  },
}
