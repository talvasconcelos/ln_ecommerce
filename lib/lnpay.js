const fetch = require('node-fetch')

module.exports = {
  generateInvoice: async opts => {
    const options = {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.PAYMENT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        num_satoshis: opts.amount,
        memo: opts.memo,
        passThru: opts.passThru,
        expiry: 900,
      }),
    }
    try {
      const response = await fetch(
        `https://lnpay.co/v1/wallet/${process.env.LNPAY_WALLET_KEY}/invoice`,
        options
      )
      const body = await response.json()
      return {
        id: body.id,
        payment_request: body.payment_request.toUpperCase(),
      }
    } catch (e) {
      throw new Error(e)
    }
  },
  checkPayment: async id => {
    try {
      const response = await fetch(`https://lnpay.co/v1/lntx/${id}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': process.env.PAYMENT_API_KEY,
          'Content-type': 'application/json',
        },
      })
      const body = await response.json()
      return body.settled ? true : false
    } catch (e) {
      throw new Error(e)
    }
  },
}
