import axios from "axios";
import * as cheerio from 'cheerio';
import Cookie from "../../infrastructure/models/cookie.model";
import GenericError from "../../infrastructure/models/error.model";
import { KeycloakUserService } from "../../keycloak/services/user.service";

export class MiUtemAuthService {

  public static async loginAndGetCookies(correo: string, contrasenia: string): Promise<Cookie[]> {
    const pasaporteCookies = await MiUtemAuthService.loginPasaporte(correo, contrasenia)
    if (pasaporteCookies) {
      return pasaporteCookies
    }

    // Genera URI para redirigir a la página de login de miutem
    let oauthRequest;
    try {
      oauthRequest = await axios.get(`${process.env.MI_UTEM_URL}/oidc/authenticate/`, {
        maxRedirects: 0,
      })
    } catch (err) {
      if (err.response.status !== 302) {
        throw err
      }

      oauthRequest = err.response
    }
    const miutemBaseCookies = oauthRequest.headers['set-cookie'].map(it => Cookie.parse(it))

    // Hacer login
    const [response, cookies] = await KeycloakUserService.loginSSO({
      oauthUri: oauthRequest.headers.location,
      correo,
      contrasenia
    })

    // Llama al callback del MiUTEM
    let callbackResponse;
    try {
      callbackResponse = await axios.get(response.headers.location, { // Finaliza el login
        headers: {
          Cookie: Cookie.header(Cookie.merge(miutemBaseCookies, cookies)),
        },
        maxRedirects: 0
      })
    } catch (err) {
      if (err.response.status !== 302) {
        throw err
      }

      callbackResponse = err.response
    }

    const miutemCookies = callbackResponse.headers["set-cookie"].map(it => Cookie.parse(it))
    if (miutemCookies.length === 0) {
      throw GenericError.MI_UTEM_EXPIRO
    }

    return (await axios.get(`${process.env.MI_UTEM_URL}/`, {
      headers: {
        Cookie: Cookie.header(miutemCookies),
      }
    })).headers["set-cookie"].map(it => Cookie.parse(it))
  }

  private static async loginPasaporte(correo: string, contrasenia: string): Promise<Cookie[]> | undefined {
    // Intenta iniciar sesión usando página `${process.env.MI_UTEM_URL}/pasaporte`
    const cookies: Cookie[] = []
    try {
      const paginaPasaporte = await axios.get(`${process.env.MI_UTEM_URL}/pasaporte/`)
      paginaPasaporte.headers["set-cookie"].map(it => Cookie.parse(it)).forEach(it => cookies.push(it))
      const $ = cheerio.load(paginaPasaporte.data)
      const csrfToken = $("input[name=csrfmiddlewaretoken]").val()
      const response = await axios.post(`${process.env.MI_UTEM_URL}/pasaporte/`, `txt_usuario=${correo}&txt_password=${contrasenia}&csrfmiddlewaretoken=${csrfToken}`, {
        headers: {
          Cookie: Cookie.header(cookies),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        maxRedirects: 0
      });

      return Cookie.merge(cookies, response.headers["set-cookie"].map(it => Cookie.parse(it)))
    } catch (error) {
      const response = error.response
      if (response && response.status !== 302) {
        return undefined
      }

      response.headers["set-cookie"].map(it => Cookie.parse(it)).forEach(it => cookies.push(it))
      return cookies
    }
  }

  // Revisa que las cookies sean válidas
  public static async valido(cookies: Cookie[]): Promise<boolean> {
    try {
      const request = await axios.get(`${process.env.MI_UTEM_URL}/academicos/mi-perfil-estudiante`, {
        headers: {
          Cookie: Cookie.header(cookies),
        },
      })

      return !(`${request?.data}`.includes('id="kc-form-login"')) && !(`${request?.data}`.includes('var keycloak = Keycloak')) && !(`${request?.data}`.includes('form-login')) && !(`${request?.data}`.includes('id_txt_usuario')) // Si es invalido, se redirige al login mostrando el formulario de autenticación
    } catch (_) { }
    return false
  }

  // Valida las cookies y retorna el sessionid y el csrftoken.
  public static async cookiesValidas(cookies: Cookie[]): Promise<[string, string]> {
    const error = GenericError.MI_UTEM_EXPIRO
    if (!cookies) {
      error.internalCode = 3.1
      throw error
    }

    const valido = await MiUtemAuthService.valido(cookies)
    const sessionId: string = cookies?.find(it => it.name == "sessionid")?.value || null;
    const csrfToken: string = cookies?.find(it => it.name == "csrftoken")?.value || null;
    if (!valido || !sessionId || !csrfToken) {
      error.internalCode = 3.2
      throw error
    }

    return [sessionId, csrfToken];
  }
}
