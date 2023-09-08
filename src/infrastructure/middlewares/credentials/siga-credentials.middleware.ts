import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Usuario from "../../../core/models/usuario.model";
import GenericError from "../../models/error.model";
import CredentialsUtils from "../../utils/credentials.utils";
import { CredentialsMiddleware } from "./credentials.middleware";

export class SigaCredentialsMiddleware extends CredentialsMiddleware {

  public static async isLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let error = GenericError.TOKEN_INVALIDA;
      let accessToken = SigaCredentialsMiddleware.validateToken(req)

      const sigaToken: string = CredentialsUtils.getSigaToken(accessToken);
      if (sigaToken.length === 0) {
        error.internalCode = 10.4
        return next(error);
      }

      const decoded: any = jwt.decode(sigaToken);
      if (decoded.exp < Date.now() / 1000) {
        return next(GenericError.SIGA_UTEM_EXPIRO);
      }

      const sigaUser: Usuario = CredentialsUtils.getSigaUser(sigaToken);

      // @ts-ignore
      req.user = {
        username: sigaUser.username,
        email: sigaUser.correoUtem,
      }
      res.locals.loggedInUser = {
        ...res.locals.loggedInUser,
        sigaToken,
        sigaUser,
      }

      next();
    } catch (error: any) {
      next(error)
    }
  }
}
