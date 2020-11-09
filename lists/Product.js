const {
  Text,
  Password,
  Checkbox,
  CloudinaryImage,
} = require('@keystonejs/fields')
const { CloudinaryAdapter } = require('@keystonejs/file-adapters')

const fileAdapter = new CloudinaryAdapter({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_KEY,
  apiSecret: process.env.CLOUDINARY_SECRET,
  folder: 'sparkstore',
})

module.exports = {
  fields: {
    title: {
      type: Text,
      isRequired: true,
    },
    category: { type: Relationship, ref: 'Category' },
    url: {
      type: Slug,
      from: 'title',
    },
    image: { type: CloudinaryImage, adapter: fileAdapter },
    intro: { type: Text, isMultiline: true },
    description: { type: Text, isMultiline: true },
    price: { type: Integer },
  },
}
