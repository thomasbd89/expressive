const response = require('../src/middleware/response');
const MiddlewareManager = require('../src/middleware/MiddlewareManager');

describe('response middleware', () => {
  it('Should call fn properly', () => {
    const mockNext = jest.fn();
    const mockRes = {
      setHeader: jest.fn()
    };
    response(null, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/json'
    );
  });
});

describe('Middleware Manager', () => {
  describe('registerMiddleware', () => {
    it('Should register defaults and user middleware', () => {
      const manager = new MiddlewareManager();
      manager.express = {
        json: jest.fn().mockReturnValue(1)
      };
      manager.addRequestId = jest.fn().mockReturnValue(2);
      manager.helmet = jest.fn().mockReturnValue(3);
      manager.routeUtil = {
        getHandlerWithManagedNextCall: jest.fn().mockImplementation((d) => d)
      };

      const mockExpress = {
        use: jest.fn()
      };

      const mockUserMiddleware = ['abc'];
      manager.registerMiddleware(mockExpress, mockUserMiddleware);

      expect(mockExpress.use).toHaveBeenCalledTimes(5);

      expect(manager.express.json).toHaveBeenCalledWith({
        limit: manager.options.bodyLimit
      });

      expect(mockExpress.use.mock.calls[0][0]).toEqual(1);
      expect(mockExpress.use.mock.calls[1][0]).toEqual(response);
      expect(mockExpress.use.mock.calls[2][0]).toEqual(2);
      expect(mockExpress.use.mock.calls[3][0]).toEqual(3);
      expect(mockExpress.use.mock.calls[4][0]).toEqual(mockUserMiddleware);
    });

    it('Should register defaults without user middleware', () => {
      const manager = new MiddlewareManager();
      manager.express = {
        json: jest.fn().mockReturnValue(1)
      };
      manager.addRequestId = jest.fn().mockReturnValue(2);

      const mockExpress = {
        use: jest.fn()
      };

      manager.registerMiddleware(mockExpress);

      expect(mockExpress.use).toHaveBeenCalledTimes(4); // registering 4 middleware

      expect(manager.express.json).toHaveBeenCalledWith({
        limit: manager.options.bodyLimit
      });

      expect(mockExpress.use.mock.calls[0][0]).toEqual(1);
      expect(mockExpress.use.mock.calls[1][0]).toEqual(response);
      expect(mockExpress.use.mock.calls[2][0]).toEqual(2);
    });
  });

  describe('registerNotFoundHandler', () => {
    it('Should register given handler', () => {
      const mockExpress = {
        use: jest.fn()
      };

      const manager = new MiddlewareManager();

      const someMockHandler = 'hehe';
      manager.registerNotFoundHandler(mockExpress, someMockHandler);

      expect(mockExpress.use).toHaveBeenCalledWith(someMockHandler);
    });

    it('Should run default handler properly', () => {
      const manager = new MiddlewareManager();
      const mockReq = {
        path: '/some/path'
      };

      const mockRes = {
        status: jest.fn(),
        json: jest.fn()
      };

      manager.defaultNotFoundHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Route \'/some/path\' not found'
      });
    });
  });

  describe('_registerHelmet', () => {
    it('Should register helmet with defaults if no config is given', () => {
      const middlewareManager = new MiddlewareManager();
      middlewareManager.helmet = jest.fn().mockReturnValue(123);

      const mockExpress = {
        use: jest.fn()
      };
      middlewareManager._registerHelmet(mockExpress);
      expect(mockExpress.use).toHaveBeenCalledWith(123);
      expect(middlewareManager.helmet).toHaveBeenCalledTimes(1);
      expect(middlewareManager.helmet.mock.calls[0].length).toEqual(0);
    });

    it('Should register helmet with given config', () => {
      const mockHelmetOptions = {
        hello: 'world'
      };
      const middlewareManager = new MiddlewareManager({
        helmetOptions: mockHelmetOptions
      });
      middlewareManager.helmet = jest.fn().mockReturnValue(123);

      const mockExpress = {
        use: jest.fn()
      };
      middlewareManager._registerHelmet(mockExpress);
      expect(mockExpress.use).toHaveBeenCalledWith(123);
      expect(middlewareManager.helmet).toHaveBeenCalledTimes(1);
      expect(middlewareManager.helmet).toHaveBeenCalledWith(mockHelmetOptions);
    });
  });
});
