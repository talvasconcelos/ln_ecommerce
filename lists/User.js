const { Text, Password, Checkbox } = require('@keystonejs/fields')

module.exports = {
    fields: {
        username: {
            type: Text,
            isRequired: true,
        },
        password: {
            type: Password,
            isRequired: true,
        },
        isAdmin: { type: Checkbox, defaultValue: false },
    },
}
