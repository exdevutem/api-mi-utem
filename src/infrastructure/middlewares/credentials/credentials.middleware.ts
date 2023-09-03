import {Request} from "express";
import GenericError from "../../models/error.model";

/**
 * Esta clase representa la base de los middleware 'Credentials', permitiendo una validación de token.
 */
export class CredentialsMiddleware {
  public static validateToken(req: Request): [GenericError,string]{
    let accessToken: string | undefined = req.headers["authorization"];
    let error = GenericError.TOKEN_INVALIDA;
    if(!accessToken) {
      error.internalCode = 10.1
      return [error, '']
    }

    if (!accessToken.startsWith("Bearer ")) {
      error.internalCode = 10.2
      return [error, ''];
    }

    return [error, accessToken.slice(7, accessToken.length)];
  }
}
