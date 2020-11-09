// https://lnbits.com/wallet?usr=35cdcef7ffc84574be1c860e2bd16a13&wal=9ad05718b68f4c66aad72b0a4e846e6e
const fetch = require('node-fetch')

module.exports = {
  generateInvoice: async opts => {
    const options = {
      method: 'POST',
      headers: {
        'X-Api-Key': `${process.env.PAYMENT_API_KEY}`,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        out: false,
        amount: opts.amount,
        memo: opts.memo,
      }),
    }
    try {
      const response = await fetch(
        'https://lnbits.com/api/v1/payments',
        options
      )
      const body = await response.json()
      return {
        id: body.checking_id,
        payment_request: body.payment_request,
      }
    } catch (e) {
      throw new Error(e)
    }
  },
  checkPayment: async id => {
    try {
      const response = await fetch(`https://lnbits.com/api/v1/payments/${id}`, {
        headers: {
          'X-Api-Key': '31058582ffdc4f4bb8fb7ce99efa53f3',
          'Content-type': 'application/json',
        },
      })
      const body = await response.json()
      return body.paid
    } catch (e) {
      throw new Error(e)
    }
  },
}
