import GenericError from "../../infrastructure/models/error.model";
import * as cheerio from 'cheerio'
import axios, {AxiosResponse} from "axios";
import Cookie from "../../infrastructure/models/cookie.model";

export class KeycloakUserService {
  public static async loginSSO({oauthUri, correo, contrasenia}: {
    oauthUri: string,
    esperaRedireccion?: boolean,
    correo: string,
    contrasenia: string
  }): Promise<[AxiosResponse, Cookie[]]> {
    let response = await axios.get(oauthUri); // Carga la pagina de login
    let cookies = response.headers['set-cookie'].map(it => Cookie.parse(it)) // Guarda las cookies

    let $ = cheerio.load(response.data) // Genera un lector html
    let loginPost = $('form[id="kc-form-login"]').attr('action')  // Obtiene el link de posteo de login de sso
    let tries = 0 // Intentos de login

    while (response.data.includes('You are already logged in.') === false && tries < 3) { // Intenta logearse hasta que se logee o se acaben los intentos
      try {
        await axios.post(loginPost || '', `username=${correo}&password=${contrasenia}`, { // Postea el formulario de login de sso
          headers: {
            Cookie: Cookie.header(cookies),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          maxRedirects: 0,
        })

        if (response.data.includes('Action expired.') === true) { // Si la acción expiró, se vuelve a obtener el link de posteo de login de sso
          $ = cheerio.load(response.data)
          loginPost = $('form[id="kc-form-login"]').attr('action')
        }
      } catch (err) {
        if (err.response.status === 302) { // Si el posteo de login de sso redirige, se obtiene la respuesta
          response = err.response
          break
        }
        throw err
      }
      tries++
    }

    if (response.status !== 302) {
      let err = GenericError.CREDENCIALES_INCORRECTAS
      err.metadata = {
        place: 'KeycloakUserService.loginSSO',
        tries,
        uri: oauthUri,
        status: response.status,
      }
      throw err
    }

    if (response.headers.location) {
      response.headers.location = response.headers.location.replace('http://', 'https://')
    }

    return [response, cookies]
  }

  public static async getProfile(correo: string, contrasenia: string): Promise<{
    correo: string,
    nombres: string,
    apellidos: string
  }> {
    // Obtiene el link de inicio de sesión:
    let accountRequest;
    try {
      accountRequest = await axios.get(`${process.env.SSO_UTEM_URL}/auth/realms/utem/account`, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirects: 0,
      })
    } catch (err) {
      if (err.response.status !== 302) {
        throw err;
      }

      accountRequest = err.response;
    }

    const [loginResponse, cookies] = await KeycloakUserService.loginSSO({
      oauthUri: accountRequest.headers.location,
      esperaRedireccion: true,
      correo,
      contrasenia
    })

    accountRequest = await axios.get(loginResponse.headers.location, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Cookie: Cookie.merge(cookies, loginResponse.headers['set-cookie'].map(it => Cookie.parse(it))).map(it => it.raw).join(";"),
      },
    })

    const $ = cheerio.load(accountRequest.data)
    return {
      correo: $('input[id="email"]').attr('value').trim().toLowerCase(),
      nombres: $('input[id="firstName"]').attr('value').trim(),
      apellidos: $('input[id="lastName"]').attr('value').trim(),
    }
  }
}
