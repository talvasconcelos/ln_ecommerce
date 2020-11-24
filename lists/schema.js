const {
  Text,
  Slug,
  Password,
  Select,
  Checkbox,
  Relationship,
  Integer,
  Float,
  Virtual,
} = require('@keystonejs/fields')
const { CloudinaryImage } = require('@keystonejs/fields-cloudinary-image')
const { CloudinaryAdapter } = require('@keystonejs/file-adapters')
const {
  createItem,
  getItem,
  updateItem,
} = require('@keystonejs/server-side-graphql-client')
const payment = require(`../lib/${process.env.PAYMENT_PROVIDER}`)
const { convert } = require('../lib/payment')
const { atTracking } = require('@keystonejs/list-plugins')
const { sendMail, notifyAdmin } = require('../emails')

const fileAdapter = new CloudinaryAdapter({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_KEY,
  apiSecret: process.env.CLOUDINARY_SECRET,
  folder: 'sparkstore',
})

const generateInvoice = async opts => {
  const amount = await convert(opts.total)
  const invoice = await payment.generateInvoice({
    amount: amount.sats,
    memo: `Payment for Order: ${opts.orderid} at SparkStore`,
    passThru: {
      sparkOrderId: opts.orderid,
    },
  })
  console.log(invoice)
  return { invoice, amount }
}

const access = {
  userIsAdmin: ({ authentication: { item: user } }) =>
    Boolean(user && user.isAdmin),
}

const addInvoice = async (context, userInput) => {
  // console.log('addInvoice', userInput)
  const invoice = await createItem({
    context,
    listKey: 'Invoice',
    item: userInput,
    returnFields: `id, order, invoiceId`,
  })
  return invoice
}

const updateOrder = async (context, userInput) => {
  try {
    const updateOrder = await updateItem({
      context,
      listKey: 'Order',
      item: userInput,
      returnFields: `id, invoice, settled, status`,
    })
    // console.debug('done')
    return updateOrder
  } catch (e) {
    console.error(e)
  }
}

const updateInvoice = async (context, userInput) => {
  try {
    const updateInvoice = await updateItem({
      context,
      listKey: 'Invoice',
      item: userInput,
      returnFields: `id, invoice, settled, status`,
    })
    // console.debug('done')
    return updateInvoice
  } catch (e) {
    console.error(e)
  }
}

const getInvoice = async (context, { itemId }) => {
  const invoice = await getItem({
    context,
    listKey: 'Invoice',
    itemId,
    returnFields: 'id, amount, updatedAt',
  })
  return invoice
}

// Read: public / Write: admin
const DEFAULT_LIST_ACCESS = {
  create: access.userIsAdmin,
  read: true,
  update: access.userIsAdmin,
  delete: access.userIsAdmin,
}

exports.User = {
  access: DEFAULT_LIST_ACCESS,
  fields: {
    username: {
      type: Text,
      isRequired: true,
    },
    password: {
      type: Password,
      isRequired: true,
    },
    isAdmin: { type: Checkbox, defaultValue: false },
  },
}

exports.Category = {
  access: DEFAULT_LIST_ACCESS,
  fields: {
    name: { type: Text },
    slug: { type: Slug, from: 'name' },
  },
}

exports.Product = {
  access: DEFAULT_LIST_ACCESS,
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
    price: { type: Float },
    qty: { type: Integer, defaultValue: 1, min: 1 },
  },
}

exports.CartItem = {
  access: {
    create: true,
    read: true,
    update: access.userIsAdmin,
    delete: access.userIsAdmin,
  },
  fields: {
    item: { type: Relationship, ref: 'Product', many: false },
    qty: { type: Integer, defaultValue: 1 },
  },
}

exports.Order = {
  access: {
    create: true,
    read: true,
    update: true,
    delete: access.userIsAdmin,
  },
  fields: {
    cart: { type: Relationship, ref: 'CartItem', many: true },
    total: { type: Float, isRequired: true },
    user_name: { type: Text },
    user_email: { type: Text, isRequired: true },
    user_address1: { type: Text },
    user_comments: { type: Text, isMultiline: true },
    invoice: {
      type: Relationship,
      ref: 'Invoice',
      adminConfig: {
        isReadOnly: true,
      },
    },
    settled: { type: Checkbox, defaultValue: false },
    status: {
      type: Select,
      options: 'pending, expired, paid, processed, shipped',
      defaultValue: 'pending',
    },
  },
  plugins: [atTracking({ format: 'dd/MM/yyyy hh:mm' })],
  hooks: {
    validateInput: async ({ context, resolvedData }) => {
      if (resolvedData.user_email === '' || resolvedData.user_address1 === '') {
        throw 'Error! Email is necessary!'
        return
      }
    },
    afterChange: async ({ context, operation, updatedItem }) => {
      if (operation !== 'create') return
      const { invoice, amount } = await generateInvoice({
        total: updatedItem.total,
        orderid: updatedItem.id,
      })

      try {
        await addInvoice(context, {
          order: { connect: { id: updatedItem.id } },
          fiat: updatedItem.total,
          invoiceId: invoice.id,
          amount: amount.sats,
          payment_request: invoice.payment_request,
        })
        await sendMail(updatedItem.user_email, {
          subject: 'New order at SparkStore',
          order: updatedItem,
        })
      } catch (e) {
        console.error(e)
      }
    },
  },
}

exports.Invoice = {
  access: {
    create: true,
    read: true,
    update: true,
    delete: access.userIsAdmin,
  },
  fields: {
    order: {
      type: Relationship,
      ref: 'Order',
      adminConfig: {
        isReadOnly: true,
      },
    },
    fiat: { type: Float },
    invoiceId: { type: Text, isRequired: true },
    amount: { type: Integer, isRequired: true },
    payment_request: { type: Text, isRequired: true },
  },
  plugins: [atTracking({ format: 'dd/MM/yyyy hh:mm' })],
  hooks: {
    resolveInput: async ({ operation, existingItem, resolvedData }) => {
      if (operation === 'update') {
        let lastUpdate = new Date(existingItem.updatedAt).getTime()
        let ellapsedMin = Math.floor((Date.now() - lastUpdate) / 1000 / 60)
        if (ellapsedMin < 15) {
          console.log('invoice still active')
          return { ...resolvedData, active: true }
        }
        const amount = await convert(existingItem.fiat)
        const invoice = await payment.generateInvoice({
          amount: amount.sats,
          memo: `Payment for Order: ${existingItem.order.toString()} at SparkStore`,
          passThru: {
            sparkOrderId: existingItem.order.toString(),
          },
        })
        return {
          ...resolvedData,
          invoiceId: invoice.id,
          amount: amount.sats,
          payment_request: invoice.payment_request,
        }
      }
      return resolvedData
    },
    validateInput: async ({ operation, existingItem, resolvedData }) => {
      if (operation === 'update') {
        if (resolvedData.active) {
          console.log('invoice still active')
          throw new Error('Invoice still active!')
        }
        console.log('validateInput', resolvedData)
      }
    },
    afterChange: async ({ context, operation, updatedItem, existingItem }) => {
      console.log('afterChange', updatedItem)
      const userInput = {
        id: updatedItem.order.toString(),
      }

      await updateOrder(context, {
        ...userInput,
        data:
          operation === 'create'
            ? { invoice: { connect: { id: updatedItem.id } } }
            : { status: 'pending' },
      })

      await longPolling(updatedItem.invoiceId, context, { ...userInput })
    },
  },
}

async function longPolling(id, context, input) {
  //Poll for payment, for 15min!
  let paid = false
  let startTime = Date.now()
  console.log('Started long polling!')
  const interval = setInterval(async () => {
    paid = await payment.checkPayment(id)
    let ellapsedMin = Math.floor((Date.now() - startTime) / 1000 / 60)
    if (paid || ellapsedMin > 15) {
      console.log(paid ? 'Invoice paid!' : 'Invoice expired!')
      clearInterval(interval)
      let data = {}
      data.settled = paid
      data.status = paid ? 'paid' : 'expired'
      if (paid) {
        notifyAdmin(input.id)
      }
      return updateOrder(context, { ...input, data })
    }
  }, 10000)
}
