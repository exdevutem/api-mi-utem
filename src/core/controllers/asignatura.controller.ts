import {NextFunction, Request, Response} from "express";
import {SigaApiAsignaturaService} from "../../siga-api/services/asignatura.service";
import SeccionAsignatura from "../models/seccion-asignatura.model";
import Semestre from "../models/semestre.model";
import Cookie from "../../infrastructure/models/cookie.model";
import {MiUtemNotaService} from "../../mi-utem/services/nota.service";
import {MiUtemAsignaturaService} from "../../mi-utem/services/asignatura.service";

export class AsignaturaController {
  public static async getActivasByCarrera(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  public static async getNotasByAsignatura(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  public static async getHistoricas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookies: Cookie[] = res.locals.loggedInUser.miUtemCookies;

      const soloAsignaturas: boolean = req.query.soloAsignaturas == "true";

      const asignaturasHistoricas: Semestre[] | SeccionAsignatura[] =
        await MiUtemNotaService.obtenerSeccionesHistoricas(
          cookies,
          soloAsignaturas
        );

      res.status(200).json(asignaturasHistoricas);
    } catch (error) {
      next(error);
    }
  }

  public static async getDetalle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookies: Cookie[] = res.locals.loggedInUser.miUtemCookies;

      const codigo: string = req.params.codigoId;

      const asignatura: SeccionAsignatura =
        await MiUtemAsignaturaService.getDetalleAsignatura(
          cookies,
          codigo,
          req.query.tipoHora || 'TEORIA', // Por defecto vemos la teoría
        );

      res.status(200).json(asignatura);
    } catch (error) {
      next(error);
    }
  }
}
