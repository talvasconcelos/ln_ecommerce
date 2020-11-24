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
        `${process.env.LNBITS_URL}/api/v1/payments`,
        options
      )
      const body = await response.json()
      return {
        id: body.checking_id,
        payment_request: body.payment_request.toUpperCase(),
      }
    } catch (e) {
      throw new Error(e)
    }
  },
  checkPayment: async id => {
    try {
      const response = await fetch(
        `${process.env.LNBITS_URL}/api/v1/payments/${id}`,
        {
          headers: {
            'X-Api-Key': process.env.PAYMENT_API_KEY,
            'Content-type': 'application/json',
          },
        }
      )
      const body = await response.json()
      return body.paid ? true : false
    } catch (e) {
      throw new Error(e)
    }
  },
}
