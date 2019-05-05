module.exports = {
    UserInfo: {
        "type": "object",
        "properties": {
            "firstName": {
                "type": "string"
            },
            "lastName": {
                "type": "string"
            }
        },
        required: [
            "firstName", "lastName"
        ]
    }
}