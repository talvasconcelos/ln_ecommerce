const { Slug, Text } = require('@keystonejs/fields')

module.exports = {
  fields: {
    name: { type: Text },
    slug: { type: Slug, from: 'name' },
  },
}
