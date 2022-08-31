import StatusError from '@util/error';
import { NextFunction, Request, Response } from 'express';
import { IListUserService } from '@interfaces/domain/user/services/service';
import { IEndPointsController } from 'interfaces/presentation/controller';
import { inject, injectable } from 'tsyringe';
import { tokens } from '@di/tokens';

@injectable()
export default class ListUserController implements IEndPointsController {
  constructor(
    @inject(tokens.ListUserService) private service: IListUserService,
  ) {}

  public handle(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Response | undefined {
    try {
      const info = this.service.readAll();
      return res.json({ message: info }).status(200);
    } catch (error) {
      next(new StatusError(500, `${error}`));
    }
  }
}