const RouterFactory = require("../src/RouterFactory");
const BaseController = require("../src/BaseController");

class MockControllerThrowsError extends BaseController { }
const mockErrorJestFn = jest.fn().mockImplementation(() => {
    throw new Error()
});
MockControllerThrowsError.prototype._handleRequestBase = mockErrorJestFn;

const mockSubroutes = [
    {
        path: "/users",
        router: {
            routes: [
                {
                    path: "/",
                    method: "get",
                    controller: new BaseController()
                },
                {
                    path: "/",
                    method: "post",
                    controller: new BaseController()
                }
            ],
            subroutes: [
                {
                    path: "/:userId/posts",
                    router: {
                        routes: [
                            {
                                path: "/",
                                method: "get",
                                controller: new BaseController()
                            },
                            {
                                path: "/",
                                method: "post",
                                controller: new BaseController()
                            }
                        ]
                    }
                }
            ]
        }
    }
];

describe("RouterFactory", () => {
    beforeEach(() => {
        mockErrorJestFn.mockClear();
    });

    afterEach(() => {
        mockErrorJestFn.mockClear();
    });

    describe("getExpressRouter", () => {
        it("Should register all routes and subroutes", () => {
            const mockRouter = {
                routes: [
                    {
                        path: "/",
                        method: "get",
                        controller: BaseController
                    }
                ],
                subroutes: mockSubroutes
            }

            const routerFactory = new RouterFactory();
            const mockExpressRouter = {
                get: jest.fn(),
                use: jest.fn(),
                post: jest.fn()
            }
            routerFactory._getRouter = jest.fn().mockReturnValue(mockExpressRouter);
            routerFactory.getExpressRouter(mockRouter);

            expect(mockExpressRouter.get).toHaveBeenCalledTimes(3);
            expect(mockExpressRouter.get.mock.calls[0][0]).toEqual("/");
            expect(mockExpressRouter.get.mock.calls[1][0]).toEqual("/");
            expect(mockExpressRouter.get.mock.calls[2][0]).toEqual("/");

            expect(mockExpressRouter.post).toHaveBeenCalledTimes(2);
            expect(mockExpressRouter.get.mock.calls[0][0]).toEqual("/");
            expect(mockExpressRouter.get.mock.calls[1][0]).toEqual("/");

            expect(mockExpressRouter.use).toHaveBeenCalledTimes(2);
            expect(mockExpressRouter.use.mock.calls[0][0]).toEqual("/:userId/posts");
            expect(mockExpressRouter.use.mock.calls[1][0]).toEqual("/users");
        });

        it("Should register all subroutes from top", () => {
            const mockRouter = {
                subroutes: mockSubroutes
            };

            const routerFactory = new RouterFactory();
            const mockExpressRouter = {
                get: jest.fn(),
                use: jest.fn(),
                post: jest.fn()
            }
            routerFactory._getRouter = jest.fn().mockReturnValue(mockExpressRouter);
            routerFactory.getExpressRouter(mockRouter);

            expect(mockExpressRouter.get).toHaveBeenCalledTimes(2);
            expect(mockExpressRouter.get.mock.calls[0][0]).toEqual("/");
            expect(mockExpressRouter.get.mock.calls[1][0]).toEqual("/");

            expect(mockExpressRouter.post).toHaveBeenCalledTimes(2);
            expect(mockExpressRouter.get.mock.calls[0][0]).toEqual("/");
            expect(mockExpressRouter.get.mock.calls[1][0]).toEqual("/");

            expect(mockExpressRouter.use).toHaveBeenCalledTimes(2);
            expect(mockExpressRouter.use.mock.calls[0][0]).toEqual("/:userId/posts");
            expect(mockExpressRouter.use.mock.calls[1][0]).toEqual("/users");
        });
    });

    describe("_hasValidationErrors", () => {
        it("Should return true if validation errors", () => {
            const factory = new RouterFactory();
            const errors = {
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue([1, 2, 3])
            }
            factory.validationResult = jest.fn().mockReturnValue(errors);

            const mockRes = {
                status: jest.fn(),
                json: jest.fn()
            };
            const mockReq = { name: "some name" };
            const result = factory._hasValidationErrors(mockReq, mockRes);

            expect(result).toEqual(true);
            expect(mockRes.status).toHaveBeenCalledWith(422);
            expect(mockRes.json).toHaveBeenCalledWith({
                errors: [1, 2, 3]
            });
        });

        it("Should return false if no validation errors", () => {
            const factory = new RouterFactory();
            const errors = {
                isEmpty: jest.fn().mockReturnValue(true),
                array: jest.fn().mockReturnValue([])
            }
            factory.validationResult = jest.fn().mockReturnValue(errors);

            const mockRes = {
                status: jest.fn(),
                json: jest.fn()
            };
            const mockReq = { name: "some name" };
            const result = factory._hasValidationErrors(mockReq, mockRes);

            expect(result).toEqual(false);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe("_getWrappedController", () => {
        it("should handle internal error with error handler", async () => {
            const factory = new RouterFactory();
            factory._hasValidationErrors = jest.fn().mockReturnValue(false);

            const mockErrorHandler = jest.fn();
            const mockNext = jest.fn();

            const fn = factory._getWrappedController(new MockControllerThrowsError(), mockErrorHandler);
            const mockReq = 1;
            const mockRes = 2;

            await fn(mockReq, mockRes, mockNext);

            expect(mockErrorJestFn).toHaveBeenCalled();
            expect(mockErrorHandler).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should handle if error but no error handler specified", async () => {
            const factory = new RouterFactory();
            factory._hasValidationErrors = jest.fn().mockReturnValue(false);

            const mockNext = jest.fn();

            const fn = factory._getWrappedController(new MockControllerThrowsError());
            const mockReq = 1;
            const mockRes = 2;

            await fn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });


        it("should handle if there is validation error", async () => {
            const factory = new RouterFactory();
            factory._hasValidationErrors = jest.fn().mockReturnValue(true);

            const mockNext = jest.fn();

            const fn = factory._getWrappedController(new MockControllerThrowsError());
            const mockReq = 1;
            const mockRes = 2;

            await fn(mockReq, mockRes, mockNext);

            expect(mockErrorJestFn).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it("should execute controller if given a function", async () => {
            const factory = new RouterFactory();
            factory._hasValidationErrors = jest.fn().mockReturnValue(false);

            const mockFn = jest.fn();
            const fn = factory._getWrappedController(mockFn);

            const someReq = 1;
            const someRes = 2;
            const someNext = 3;

            await fn(someReq, someRes, someNext);

            expect(mockFn).toHaveBeenCalledWith(someReq, someRes, someNext);
        });
    });

    it("Should get router from method", () => {
        const factory = new RouterFactory();

        const result = factory._getRouter();

        expect(result).toBeDefined();

    });

});
