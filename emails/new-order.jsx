const React = require('react')

module.exports = ({ recipientEmail, orderUrl }) => (
  <html>
    <body>
      <div>
        <p>Hi {recipientEmail}</p>
        <div>
          <p>
            Your order has been placed and can be seen{' '}
            <a href={orderUrl} target="_blank">
              here
            </a>
          </p>
        </div>
      </div>
    </body>
  </html>
)
