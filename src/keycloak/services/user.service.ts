import GenericError from "../../infrastructure/models/error.model";
import * as cheerio from 'cheerio'
import axios, {AxiosResponse} from "axios";
import Cookie from "../../infrastructure/models/cookie.model";

export class KeycloakUserService {
    public static async loginSSO({uri = process.env.MIUTEM_URL, esperaRedireccion = false, correo, contrasenia}: {uri?: string, esperaRedireccion?: boolean, correo: string, contrasenia: string}): Promise<[AxiosResponse, Cookie[]]> {
        let response = await axios.get(uri); // Carga la pagina de login
        // Guarda las cookies
        let cookies = response.headers['set-cookie'].map(it => Cookie.parse(it));
        let $ = cheerio.load(response.data) // Genera un lector html
        let loginPost = $('form[id="kc-form-login"]').attr('action')  // Obtiene el link de posteo de login de sso
        let tries = 0 // Intentos de login

        while(response.data.includes('You are already logged in.') === false && tries < 3){ // Intenta logearse hasta que se logee o se acaben los intentos
            try {
                response = await axios.post(loginPost, `username=${correo}&password=${contrasenia}`, { // Postea el formulario de login de sso
                    headers: {
                        Cookie: cookies.map(it => it.raw).join(";"),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    maxRedirects: esperaRedireccion ? 0 : undefined,
                })

                if(response.data.includes('Action expired.') === true){ // Si la acción expiró, se vuelve a obtener el link de posteo de login de sso
                    $ = cheerio.load(response.data)
                    loginPost = $('form[id="kc-form-login"]').attr('action')
                }
            } catch (res) {
                if(esperaRedireccion && res.response.status === 302){ // Si el posteo de login de sso redirige, se obtiene la respuesta
                    response = res.response
                    break
                }
            }
            tries++
        }

        if(esperaRedireccion && response.status == 302) {
            return [response, cookies]
        }

        if(response.data.includes('You are already logged in.') === false) {
            let error = GenericError.CREDENCIALES_INCORRECTAS
            if(esperaRedireccion && response.status !== 302){
                error.internalCode = 2
                throw error
            }

            throw error
        }

        return [response, cookies]
    }

    public static async getProfile(correo: string, contrasenia: string): Promise<{ correo: string, nombres: string, apellidos: string }> {
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
            uri: accountRequest.headers.location,
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
