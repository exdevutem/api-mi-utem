import jwt from "jsonwebtoken";
import Usuario from "../../core/models/usuario.model";
import Cookie from "../models/cookie.model";
import axios from "axios";

export default class CredentialsUtils {
  public static isCookieExpired(token: string): boolean {
    const data: string[] = atob(token).split("|"); // Formato: expira|cookie1|cookie2|cookie3...
    if (data.length <= 1) { // Valida el formato
      return true;
    }

    const expirationString = data[0];
    const expirationDate = Date.parse(expirationString);
    const now = new Date().getTime();
    return expirationDate < now;
  }

  public static getMiUtemToken(authToken: string): string | undefined {
    const authTokenComponents = authToken.split("|");
    if (authTokenComponents.length < 3) {
      return;
    }

    const miUtemToken = authTokenComponents[0];
    if (!CredentialsUtils.isBase64(miUtemToken)) {
      return;
    }
    return miUtemToken;
  }

  public static getMiUtemCookies(authToken: string): Cookie[] {
    const token = CredentialsUtils.getMiUtemToken(authToken)
    if (!token || token.length === 0) {
      return [];
    }
    let data: string[] = atob(token).split("|"); // Formato: expira|cookie1|cookie2|cookie3...
    data = data.filter(it => it && it.length > 0);
    if (data.length <= 1) { // Valida el formato
      return [];
    }

    if (CredentialsUtils.isCookieExpired(token)) { // Valida que no haya expirado
      return [];
    }


    return data.slice(1).map(it => Cookie.parse(atob(it)));
  }

  public static getAcademiaToken(authToken: string): string | undefined {
    const authTokenComponents = authToken.split("|");
    if (authTokenComponents.length < 3) {
      return;
    }
    const academiaToken = authTokenComponents[2];
    if (!CredentialsUtils.isBase64(academiaToken)) {
      return;
    }
    return academiaToken;
  }

  public static getAcademiaCookies(authToken: string): Cookie[] {
    const token = CredentialsUtils.getAcademiaToken(authToken);
    if (!token || token.length === 0) {
      return [];
    }

    let data: string[] = atob(token).split("|"); // Formato: expira|cookie1|cookie2|cookie3...
    data = data.filter(it => it && it.length > 0);
    if (data.length <= 1) { // Valida el formato
      return [];
    }

    if (CredentialsUtils.isCookieExpired(token)) { // Valida que no haya expirado
      return [];
    }

    return data.slice(1).map(it => Cookie.parse(atob(it)));
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

  public static async isMiUTEMTokenExpired(token: string): Promise<boolean> {
    if (token == null) {
      return true;
    }

    let miUtemCookies: Cookie[] = CredentialsUtils.getMiUtemCookies(token);
    if(miUtemCookies.length === 0) {
      return true;
    }

    try {
      const request = await axios.get(`${process.env.MIUTEM_URL}/academicos/mi-perfil-estudiante`, {
        headers: {
          Cookie: Cookie.header(miUtemCookies),
        },
      });
      return !(`${request?.data}`.includes('id="kc-form-login"')) && !(`${request?.data}`.includes('var keycloak = Keycloak')) && !(`${request?.data}`.includes('form-login')) && !(`${request?.data}`.includes('id_txt_usuario'));
    } catch (_) {}

    return true;
  }

  public static async isAcademiaTokenExpired(token: string): Promise<boolean> {
    if (token == null) {
      return true;
    }

    let academiaCookies: Cookie[] = CredentialsUtils.getAcademiaCookies(token);
    if(academiaCookies.length === 0) {
      return true;
    }

    try {
      const perfilResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/libro_de_clases/bitacora_de_clases`, {
        withCredentials: true,
        headers: {
          Cookie: Cookie.header(academiaCookies),
        }
      });

      return !(`${perfilResponse.data}`.includes('Hola,'));
    } catch (e) {}

    return true;
  }

  public static isSigaTokenExpired(token: string): boolean {
    if (token == null) {
      return true;
    }

    const payload: any = jwt.decode(token);
    return payload.exp < Date.now() / 1000;
  }

  public static getSigaToken(authToken: string): string | undefined {
    const authTokenComponents = authToken.split("|");
    if (authTokenComponents.length < 1) {
      return;
    } else if (authTokenComponents.length == 1) {
      return authToken;
    } else {
      return authToken.split("|")[1];
    }
  }

  public static createToken(sigaBearerToken: string, miUtemCookies: Cookie[], academiaCookies: Cookie[]): string {
    const expira = new Date((new Date).getTime() + (6 * 60 * 60 * 1000));
    const miutemToken = btoa(`${expira}|${(miUtemCookies || []).map(it => btoa(it.simple())).join('|')}`)
    const academiaToken = btoa(`${expira}|${(academiaCookies || []).map(it => btoa(it.simple())).join('|')}`)

    return `${miutemToken}|${sigaBearerToken}|${academiaToken}`;
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

  private static isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) == str;
    } catch (err) {
      return false;
    }
  }
}
