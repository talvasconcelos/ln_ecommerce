const mailer = require('nodemailer')

const transport = mailer.createTransport({
  host: 'smtp.securemail.pro',
  port: 465,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
})

const newOrderTemplate = (recipient, order) => `
  <div>
    <p><b>Hi ${recipient}</b>, thank you for choosing SparkStore.</p>
    <div>
      <p>
        Your new order has been placed and can be seen <a href="https://sparkstore.sparkpay.pt/invoices/${order.id}" target="_blank">
          here
        </a>
      </p>
    </div>
  </div>
  `

const sendMail = async (recipient, message) => {
  try {
    await transport.sendMail(
      {
        from: 'geral@sparkpay.pt',
        to: recipient,
        subject: message.subject,
        html: newOrderTemplate(recipient, message.order),
      },
      (err, info) => {
        if (err) {
          console.log(err)
        } else {
          console.log(info)
        }
      }
    )
  } catch (e) {
    console.error(e)
  }
  return
}

// sendMail('talvasconcelos@gmail.com', {
//   subject: 'testing mail',
//   order: {
//     id: 'hhhhehhehe',
//   },
// })

module.exports = { sendMail }
