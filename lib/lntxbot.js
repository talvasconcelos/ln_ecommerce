const fetch = require('node-fetch')

module.exports = {
  generateInvoice: async opts => {
    const options = {
      method: 'POST',
      headers: {
        Authorization: `${process.env.PAYMENT_API_KEY}`,
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        amt: opts.amount.toString(),
        memo: opts.memo,
      }),
    }
    try {
      const response = await fetch(
        'https://lntxbot.bigsun.xyz/addinvoice',
        options
      )
      const body = await response.json()
      return {
        id: body.payment_hash,
        payment_request: body.payment_request.toUpperCase(),
      }
    } catch (e) {
      throw new Error(e)
    }
  },
  checkPayment: async id => {
    try {
      ///invoicestatus/<hash>
      const response = await fetch(
        `https://lntxbot.bigsun.xyz/invoicestatus/${id}?wait=false`,
        {
          headers: {
            Authorization: process.env.PAYMENT_API_KEY,
            'Content-type': 'application/json',
          },
        }
      )
      const body = await response.json()
      const paid = !(body.error && body.message === 'timeout')
      return paid
    } catch (e) {
      throw new Error(e)
    }
  },
}
