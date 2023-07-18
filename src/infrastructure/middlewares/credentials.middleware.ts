import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";
import Usuario from "../../core/models/usuario.model";
import GenericError from "../models/error.model";
import CredentialsUtils from "../utils/credentials.utils";

export class CredentialsMiddleware {
  public static async isLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let accessToken: string | undefined = req.headers["authorization"];
      if (accessToken) {
        if (!accessToken.startsWith("Bearer ")) {
          return next(GenericError.TOKEN_INVALIDA);
        }
        accessToken = accessToken.slice(7, accessToken.length);

        const miUtemCookies: object = CredentialsUtils.getMiUtemCookies(accessToken);
        const sigaToken: string = CredentialsUtils.getSigaToken(accessToken);

        res.locals.loggedInUser = {
          sigaToken,
          miUtemCookies,
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
        return next(GenericError.TOKEN_INVALIDA);
      }
    } catch (error: any) {
      next(error);
    }
  }
}
