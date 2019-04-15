const { RestMethods } = require("../../../lib/expressive.bundle");
const GetUsers = require("./controllers/GetUsers");
const Hello = require("./controllers/Hello");
const HelloDocs = require("./docs/HelloDocs");
const GetSpecificUser = require("./controllers/GetSpecificUser");
const UserIdParamValidator = require("./validators/UserIdParamValidator");

function customErrorHandler(err, req, res, next) {
    if (err.message == "Could not find user") {
        res.status(404);
        res.send("Not found");
    } else {
        res.status(500);
        res.send("Internal server error");
    }
    next();
}

module.exports = {
    routes: [
        {
            method: RestMethods.GET,
            path: "/",
            controller: Hello,
            doc: HelloDocs
        },
        {
            method: RestMethods.GET,
            path: "/users",
            controller: GetUsers
        },
        {
            method: RestMethods.GET,
            path: "/users/:userId",
            controller: GetSpecificUser,
            validator: UserIdParamValidator,
            errorHandler: customErrorHandler
        }
    ]
}