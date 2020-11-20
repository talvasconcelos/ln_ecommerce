const fetch = require('node-fetch')
const { SocksProxyAgent } = require('socks-proxy-agent')

const agent = new SocksProxyAgent('socks5://127.0.0.1:9050')

module.exports = {
  generateInvoice: async opts => {
    const options = {
      agent,
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
        `${process.env.LNBITS_TOR}/api/v1/payments`,
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
        `${process.env.LNBITS_TOR}/api/v1/payments/${id}`,
        {
          agent,
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
