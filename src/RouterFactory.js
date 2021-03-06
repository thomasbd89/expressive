/* eslint-disable no-invalid-this */
const { Router } = require('express');
const { celebrate: celebrateMiddleware } = require('celebrate');
const RouteUtil = require('./RouteUtil');
const AuthUtil = require('./AuthUtil');
const CelebrateUtils = require('./CelebrateUtils');
const BaseController = require('./BaseController');

async function _handleRequestBase(req, res, next) {
  this.req = req;
  this.res = res;
  this.next = next;

  return this.handleRequest();
}

module.exports = class RouterFactory {
  constructor(expressiveOptions) {
    this.expressiveOptions = expressiveOptions;
    this.routeUtil = RouteUtil;
    this.authUtil = new AuthUtil();
    this.celebrateMiddleware = celebrateMiddleware;
    this.CelebrateUtils = CelebrateUtils;
  }

  _getWrappedController(controllerInstance) {
    return async (req, res, next) => {
      try {
        const mappedReq = BaseController.requestMapper(req);
        await _handleRequestBase.call(controllerInstance, mappedReq, res, next);
        if (!controllerInstance.res.headersSent) {
          controllerInstance.internalServerError(
            'Server did not send any response'
          );
        }
      } catch (e) {
        return next(e);
      }
    };
  }

  _registerCelebrateErrorMiddleware(validationSchema, routerArgs) {
    if (!validationSchema) return;

    const { options, ...validationSchemaObj } = validationSchema;

    const sanitizedValidationSchema = this.CelebrateUtils.getSanitizedValidationSchema(
      validationSchemaObj
    );

    if (sanitizedValidationSchema) {
      this.CelebrateUtils.lowercaseHeaderSchemaProperties(
        sanitizedValidationSchema
      );
      routerArgs.push(
        this.celebrateMiddleware(sanitizedValidationSchema, {
          abortEarly: false,
          ...(options || {})
        })
      );
    }
  }

  _setAuthorizerMiddleware(authorizer, routerArgs) {
    const authMiddleware = this.authUtil.getAuthorizerMiddleware(
      authorizer,
      this.expressiveOptions.authObjectHandler
    );

    if (authMiddleware) {
      routerArgs.push(authMiddleware);
    }
  }

  _setFileUploadValidationMiddleware(validationSchema, routerArgs) {
    if (!validationSchema || !validationSchema.fileUpload) return;

    routerArgs.push(
      this.CelebrateUtils.getCelebrateValidationMiddlewareForFileUpload(
        validationSchema.fileUpload
      )
    );
  }

  _registerMiddleware(
    routerArgs,
    { validationSchema, authorizer, middleware }
  ) {
    this._setAuthorizerMiddleware(authorizer, routerArgs);
    this._registerCelebrateErrorMiddleware(validationSchema, routerArgs);

    const nextAdjustedMiddleware = !middleware
      ? []
      : middleware.map((m) => this.routeUtil.getHandlerWithManagedNextCall(m));

    routerArgs.push(...nextAdjustedMiddleware);

    this._setFileUploadValidationMiddleware(validationSchema, routerArgs);
  }

  _registerPreHandlers(routerArgs, handler) {
    if (!handler) return;

    if (Array.isArray(handler)) {
      const nextAdjustedMiddleware = handler.map((m) =>
        this.routeUtil.getHandlerWithManagedNextCall(m)
      );
      routerArgs.push(...nextAdjustedMiddleware);
    } else {
      routerArgs.push(this.routeUtil.getHandlerWithManagedNextCall(handler));
    }
  }

  _registerRoute(router, { method, path, controller }) {
    const routerArgs = [path];

    this._registerPreHandlers(routerArgs, controller.pre);

    this._registerMiddleware(routerArgs, {
      validationSchema: controller.validationSchema,
      authorizer: controller.authorizer,
      middleware: controller.middleware
    });

    routerArgs.push(this._getWrappedController(controller));

    router[method](...routerArgs);
  }

  _registerSubroute(
    router,
    {
      path,
      router: subrouter,
      authorizer,
      validationSchema = null,
      middleware = [],
      pre = null
    }
  ) {
    const routerArgs = [path];

    this._registerPreHandlers(routerArgs, pre);

    this._registerMiddleware(routerArgs, {
      validationSchema,
      authorizer,
      middleware
    });

    routerArgs.push(this.getExpressRouter(subrouter));

    router.use(...routerArgs);
  }

  _getRouter() {
    return new Router({
      mergeParams: true
    });
  }

  _handleDuplicateUrls(expressiveRouter) {
    const duplicateUrls = this.routeUtil.getDuplicateUrls(expressiveRouter);
    if (duplicateUrls.length > 0) {
      throw new Error(
        `Duplicate endpoints detected! -> ${duplicateUrls.join(', ')}`
      );
    }
  }

  getExpressRouter(expressiveRouter) {
    this._handleDuplicateUrls(expressiveRouter);

    const router = this._getRouter();

    if (expressiveRouter.routes) {
      expressiveRouter.routes.forEach((routeConf) => {
        this._registerRoute(router, routeConf);
      });
    }

    if (expressiveRouter.subroutes) {
      expressiveRouter.subroutes.forEach((subroute) => {
        this._registerSubroute(router, subroute);
      });
    }

    return router;
  }
};
