import { NextFunction, Request, Response } from "express";
import { Cookie } from "puppeteer";
import { MiUtemAsignaturaService } from "../../mi-utem/services/asignatura.service";
import { SigaApiAsignaturaService } from "../../siga-api/services/asignatura.service";
import SeccionAsignatura from "../models/seccion-asignatura.model";
import Semestre from "../models/semestre.model";

export class AsignaturaController {
  public static async getActivasByCarrera(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sigaToken: string = res.locals.loggedInUser.sigaToken;
      const carreraId: string = req.params.carreraId;

      const asignaturas: SeccionAsignatura[] =
        await SigaApiAsignaturaService.getAsignaturas(sigaToken, carreraId);

      res.status(200).json(asignaturas);
    } catch (error) {
      next(error);
    }
  }

  public static async getNotasByAsignatura(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sigaToken: string = res.locals.loggedInUser.sigaToken;
      const carreraId: string = req.params.carreraId;
      const seccionId: string = req.params.seccionId;

      const asignatura: SeccionAsignatura =
        await SigaApiAsignaturaService.getNotasAsignatura(
          sigaToken,
          carreraId,
          seccionId
        );

      res.status(200).json(asignatura);
    } catch (error) {
      next(error);
    }
  }

  public static async getHistoricas(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const miUtemCookies: Cookie[] = res.locals.loggedInUser.miUtemCookies;
      const soloAsignaturas: boolean = req.query.soloAsignaturas == "true";

      const asignaturasHistoricas: Semestre[] | SeccionAsignatura[] =
        await MiUtemAsignaturaService.getAsignaturasHistoricas(
          miUtemCookies,
          soloAsignaturas
        );

      res.status(200).json(asignaturasHistoricas);
    } catch (error) {
      next(error);
    }
  }
}
