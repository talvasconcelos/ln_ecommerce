const tr = require('tor-request')
// const { SocksProxyAgent } = require('socks-proxy-agent')
//
// const agent = new SocksProxyAgent('socks5://127.0.0.1:9050')
const TOR_URL = process.env.LNBITS_TOR

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
      await tr.request(
        `http://${TOR_URL}/api/v1/payments`,
        options,
        (err, res, body) => {
          if (err) {
            console.error(err)
            throw new Error(err)
          }
          console.log(body)
          return {
            id: body.checking_id,
            payment_request: body.payment_request.toUpperCase(),
          }
        }
      )
    } catch (e) {
      throw new Error(e)
    }
  },
  checkPayment: async id => {
    try {
      await tr.request(
        `http://${TOR_URL}/api/v1/payments/${id}`,
        {
          headers: {
            'X-Api-Key': process.env.PAYMENT_API_KEY,
            'Content-type': 'application/json',
          },
        },
        (err, res, body) => {
          if (err) {
            console.error(err)
            throw new Error(err)
          }
          console.log(body)
          return body.paid ? true : false
        }
      )
      // const response = await fetch(`http://${TOR_URL}/api/v1/payments/${id}`, {
      //   headers: {
      //     'X-Api-Key': process.env.PAYMENT_API_KEY,
      //     'Content-type': 'application/json',
      //   },
      // })
      // const body = await response.json()
    } catch (e) {
      throw new Error(e)
    }
  },
}
