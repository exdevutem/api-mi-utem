import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";
import Usuario from "../../core/models/usuario.model";
import GenericError from "../models/error.model";
import CredentialsUtils from "../utils/credentials.utils";
import Cookie from "../models/cookie.model";

export class CredentialsMiddleware {
  public static async isLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let accessToken: string | undefined = req.headers["authorization"];
      let error = GenericError.TOKEN_INVALIDA;
      if (accessToken) {
        if (!accessToken.startsWith("Bearer ")) {
          error.internalCode = 10.1
          return next(error);
        }
        accessToken = accessToken.slice(7, accessToken.length);

        const miUtemCookies: Cookie[] = CredentialsUtils.getMiUtemCookies(accessToken);
        if(miUtemCookies.length === 0) {
          error.internalCode = 10.2
          return next(error);
        }
        const sigaToken: string = CredentialsUtils.getSigaToken(accessToken);

        const academiaCookies: Cookie[] = CredentialsUtils.getAcademiaCookies(accessToken);
        if(academiaCookies.length === 0) {
          error.internalCode = 10.3
          return next(error);
        }

        res.locals.loggedInUser = {
          sigaToken,
          miUtemCookies,
          academiaCookies,
        };

        if (sigaToken) {
          const decoded: any = jwt.decode(sigaToken);
          if (decoded.exp < Date.now() / 1000) {
            return next(GenericError.SIGA_UTEM_EXPIRO);
          }

          const sigaUser: Usuario = CredentialsUtils.getSigaUser(sigaToken);

          // @ts-ignore
          req.user = {
            username: sigaUser.username,
            email: sigaUser.correoUtem,
          };

          res.locals.loggedInUser.sigaUser = sigaUser;
        }

        next();
      } else {
        error.internalCode = 10.4
        return next(error);
      }
    } catch (error: any) {
      next(error);
    }
  }
}
