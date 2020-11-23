const fetch = require('got')
const { SocksProxyAgent } = require('socks-proxy-agent')

const agent = new SocksProxyAgent('socks5h://127.0.0.1:9050')
const TOR_URL = process.env.LNBITS_TOR

module.exports = {
  generateInvoice: async opts => {
    const options = {
      agent: { http: agent, https: agent },
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
        `http://${TOR_URL}/api/v1/payments`,
        options
      ).json()
      const body = await response
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
      const response = await fetch(`http://${TOR_URL}/api/v1/payments/${id}`, {
        agent: { http: agent, https: agent },
        headers: {
          'X-Api-Key': process.env.PAYMENT_API_KEY,
          'Content-type': 'application/json',
        },
      }).json()
      const body = await response
      return body.paid ? true : false
    } catch (e) {
      throw new Error(e)
    }
  },
}
