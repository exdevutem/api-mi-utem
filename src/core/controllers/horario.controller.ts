import { NextFunction, Request, Response } from "express";
import { SigaApiHorarioService } from "../../siga-api/services/horario.service";
import Horario from "../models/horario.model";

export class HorarioController {
  public static async get(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sigaToken: string = res.locals.loggedInUser.sigaToken;
      const carreraId: string = req.params.carreraId;

      const horarioSiga: Horario =
        await SigaApiHorarioService.getHorarioByCarrera(sigaToken, carreraId);

      res.status(200).json(horarioSiga);
    } catch (error) {
      next(error);
    }
  }
}
