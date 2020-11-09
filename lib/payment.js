const fetch = require('node-fetch')

const exchangeRate = async conv => {
  let c = conv.toUpperCase()
  const res = await fetch('https://api.opennode.com/v1/rates')
  const body = await res.json()
  const conversion = body.data[`BTC${c}`][c]
  // console.log(conversion)
  return conversion
}

exports.convert = async (price, rate = false) => {
  if (!rate) {
    rate = await exchangeRate('EUR')
  }
  let conversion = price / rate
  let btc = Math.round(conversion * 100000000) / 100000000
  let sats = Math.round(conversion * 100000000)
  return { btc, sats }
}
