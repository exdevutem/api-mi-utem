import {NextFunction, Request, Response} from "express";
import {BecaAlimentacionService} from "../../academia/services/beca-alimentacion.service";

export class AcademiaController {
  public static async getCodigoBecaAlimentacion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cookies = res.locals.loggedInUser.academiaCookies;

      const codigo = await BecaAlimentacionService.generarCodigoAlimentacion(cookies)

      res.status(200).json({ codigo });
    } catch (error) {
      next(error);
    }
  }
}
