import { BaseController, ValidationSchema, Joi } from "../../../../src";

export class GetUserController extends BaseController {
  validationSchema?: ValidationSchema = {
    params: {
      userId: Joi.number().positive().required()
    },
    options: {
      allowUnknown: true
    }
  }
  async handleRequest() {
    const { userId } = this.getData().params;

    this.ok({
      id: userId,
      name: 'Sabbir'
    })
  }
}

export class GetUsersController extends BaseController {
  async handleRequest() {
    this.ok([
      {
        id: 1,
        name: 'Sabbir'
      },
      {
        id: 2,
        name: 'John'
      }
    ])
  }
}