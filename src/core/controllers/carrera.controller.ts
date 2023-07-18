import {NextFunction, Request, Response} from "express";
import {SigaApiCarreraService} from "../../siga-api/services/carrera.service";
import Carrera from "../models/carrera.model";

export class CarreraController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sigaToken: string = res.locals.loggedInUser.sigaToken;

      const carreras: Carrera[] = await SigaApiCarreraService.getCarreras(
        sigaToken
      );

      res.status(200).json(carreras);
    } catch (error) {
      next(error);
    }
  }
}
