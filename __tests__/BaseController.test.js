const BaseController = require('../src/BaseController');

describe('BaseController', () => {
  it('should be defined and should have handleRequest method', () => {
    expect(BaseController).toBeDefined();

    const base = new BaseController();
    base.handleRequest();
    expect(base.handleRequest).toBeDefined();
  });

  it('should throw error if handleRequest is not implemented', async () => {
    class SomeController extends BaseController {}

    const controller = new SomeController();

    let result;
    try {
      await controller.handleRequest();
    } catch (error) {
      result = error;
    }

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toEqual(
      `'handleRequest' not implemented in SomeController`
    );
  });

  describe('response', () => {
    const controller = new BaseController();

    const mockRes = {
      status: jest.fn(),
      send: jest.fn(),
      json: jest.fn(),
      jsonp: jest.fn(),
      sendFile: jest.fn(),
      sendStatus: jest.fn(),
      end: jest.fn()
    };

    controller.res = mockRes;

    beforeEach(() => {
      Object.keys(mockRes).forEach((fn) => {
        mockRes[fn].mockClear();
      });
    });

    it('should handle method ok properly', () => {
      controller.ok();
      expect(mockRes.sendStatus).toHaveBeenCalledWith(200);

      controller.ok(123);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(123);
    });

    it('should handle method created properly with dto', () => {
      controller.created();
      expect(mockRes.sendStatus).toHaveBeenCalledWith(201);

      controller.created(123);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(123);
    });

    it('should handle method accepted properly with dto', () => {
      controller.accepted();
      expect(mockRes.sendStatus).toHaveBeenCalledWith(202);

      controller.accepted(123);
      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith(123);
    });

    it('should handle method noContent properly with dto', () => {
      controller.noContent();
      expect(mockRes.sendStatus).toHaveBeenCalledWith(204);
    });

    it('should handle method badRequest properly with message', () => {
      controller.badRequest();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Bad request'
      });

      controller.badRequest('some message');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message'
      });
    });

    it('should handle method unauthorized properly with message', () => {
      controller.unauthorized();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unauthorized'
      });

      controller.unauthorized('some message');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message'
      });
    });

    it('should handle method forbidden properly with message', () => {
      controller.forbidden();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden'
      });

      controller.forbidden('some message');
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message'
      });
    });

    it('should handle method notFound properly with message', () => {
      controller.notFound();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not Found'
      });

      controller.notFound('some message');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message'
      });
    });

    it('should handle method tooMany properly with message', () => {
      controller.tooMany();
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Too many requests'
      });

      controller.tooMany('some message');
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message'
      });
    });

    it('Should handle method internalServerError properly', () => {
      controller.internalServerError();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      controller.internalServerError('some message');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message'
      });

      controller.internalServerError('some message', {
        some: 'data'
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message',
        some: 'data'
      });
    });

    it('Should handle method notImplemented properly', () => {
      controller.notImplemented();
      expect(mockRes.status).toHaveBeenCalledWith(501);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not implemented'
      });

      controller.notImplemented('some message');
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'some message'
      });
    });
  });

  it('should return all data for getData given all params have some data', () => {
    const req = {
      body: {
        name: 'john'
      },
      query: {
        age: 2
      },
      params: {
        userId: 4
      },
      fileUpload: {
        file: 1,
        files: 2
      }
    };

    const controller = new BaseController();

    controller.req = req;

    expect(controller.getData()).toEqual(req);
  });

  it('should return all data for getData given only body has data', () => {
    const req = {
      body: {
        name: 'john'
      }
    };
    const controller = new BaseController();

    controller.req = req;

    expect(controller.getData().body).toEqual({
      name: 'john'
    });
  });

  it('should return empty object for no data from getData', () => {
    const req = {};
    const controller = new BaseController();

    controller.req = req;

    expect(controller.getData()).toEqual({});
  });

  it('should return headers from getHeaders', () => {
    const req = {
      headers: {
        name: 'john'
      }
    };
    const controller = new BaseController();

    controller.req = req;

    expect(controller.getHeaders()).toEqual({
      name: 'john'
    });
  });

  it('should return cookies from getCookies', () => {
    const req = {
      cookies: {
        name: 'john'
      },
      signedCookies: {
        some: 'otherCookie'
      }
    };
    const controller = new BaseController();

    controller.req = req;

    expect(controller.getCookies()).toEqual(req);
  });

  it('should call internal handler if this.ok is called', () => {
    class SomeController extends BaseController {
      handleRequest() {
        this.ok({ some: 'data' });
      }
    }
    const someRes = {
      status: jest.fn(),
      json: jest.fn()
    };
    const mockHandleInternalError = jest.fn();

    const controller = new SomeController();
    controller.res = someRes;

    controller.internalServerError = mockHandleInternalError;

    controller.handleRequest();

    expect(someRes.json).toHaveBeenCalled();
    expect(someRes.status).toHaveBeenCalled();
    expect(mockHandleInternalError).not.toHaveBeenCalled();
  });
});
