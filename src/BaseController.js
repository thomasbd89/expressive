module.exports = class BaseController {
    constructor() {
        this.req = null;
        this.res = null;
        this.next = null;
    }

    async _handleRequestBase(req, res, next) {
        this.req = req;
        this.res = res;
        this.next = next;

        await this.handleRequest();
    }

    async handleRequest() {
        throw new Error(`'handleRequest' not implemented in ${this.constructor.name}`);
    }

    _jsonResponseWithMessage(code, message) {
        return this.res.status(code).json({ message });
    }

    ok(dto) {
        if (!!dto) {
            return this.res.status(200).json(dto);
        } else {
            return this.res.sendStatus(200);
        }
    }

    created(data = null) {
        return data ? this.res.status(201).json(data) : this.res.sendStatus(201);
    }

    clientError(message) {
        return this._jsonResponseWithMessage(400, message ? message : "Unauthorized");
    }

    unauthorized(message) {
        return this._jsonResponseWithMessage(401, message ? message : "Unauthorized");
    }

    paymentRequired(message) {
        return this._jsonResponseWithMessage(402, message ? message : "Payment required");
    }

    forbidden(message) {
        return this._jsonResponseWithMessage(403, message ? message : "Forbidden");
    }

    notFound(message) {
        return this._jsonResponseWithMessage(404, message ? message : "Not found");
    }

    conflict(message) {
        return this._jsonResponseWithMessage(409, message ? message : "Conflict");
    }

    tooMany(message) {
        return this._jsonResponseWithMessage(429, message ? message : "Too many requests");
    }

    fail(message, data = undefined) {
        return this.res.status(500).json({
            message,
            data
        });
    }
};
