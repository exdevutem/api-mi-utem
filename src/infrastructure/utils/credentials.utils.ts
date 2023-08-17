import jwt from "jsonwebtoken";
import Usuario from "../../core/models/usuario.model";
import Cookie from "../models/cookie.model";

export default class CredentialsUtils {
  public static getMiUtemCookies(token: string) {
    const cookies: string = token.split("|")[0];
    const sessionId: string = cookies.slice(0, 32);
    const csrfToken: string = cookies.slice(32);

    let date = new Date();
    date.setDate(date.getDate() + 364);

    return [
      {
        name: "sessionid",
        value: sessionId,
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: false,
        session: true,
        sameSite: "Lax",
      },
      {
        name: "MIUTEM",
        value: "miutem1",
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        session: true,
      },
      {
        name: "csrftoken",
        value: csrfToken,
        domain: "mi.utem.cl",
        path: "/",
        expires: date.getTime() / 1000,
        httpOnly: false,
        secure: false,
        session: false,
        sameSite: "Lax",
      },
      {
        name: "dialogShown",
        value: "0",
        domain: "mi.utem.cl",
        path: "/",
        expires: date.getTime() / 1000,
        httpOnly: false,
        secure: false,
        session: false,
      },
    ];
  }

  public static getSigaUser(sigaBearerToken: string): Usuario | null {
    if (sigaBearerToken != null) {
      const sigaPayload: any = jwt.decode(sigaBearerToken);

      return {
        nombres: sigaPayload.given_name,
        apellidos: sigaPayload.family_name,
        nombreCompleto: sigaPayload.name,
        correoUtem: sigaPayload.email,
        username: sigaPayload.preferred_username,
      };
    }
  }

  public static getSigaToken(token: string): string | undefined {
    return token.split("|")[1];
  }

  public static createToken(sigaBearerToken: string, miUtemCookies: Cookie[]): string {
    let miUtemToken = "";
    if (miUtemCookies != null) {
      let sessionId: string = miUtemCookies.find(cookie => cookie.name == "sessionid")?.value || "";
      let csrfToken: string = miUtemCookies.find(cookie => cookie.name == "csrftoken")?.value || "";

      miUtemToken = sessionId + csrfToken;
    }

    return miUtemToken + "|" + sigaBearerToken;
  }

  public static get emptyCookies(): object {
    return [
      {
        name: "sessionid",
        value: "",
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: false,
        session: true,
        sameSite: "Lax",
      },
      {
        name: "csrftoken",
        value: "",
        domain: "mi.utem.cl",
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        session: false,
        sameSite: "Lax",
      },
    ];
  }
}
