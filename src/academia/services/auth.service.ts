import GenericError from "../../infrastructure/models/error.model";
import {Issuer} from "openid-client";
import axios from "axios";
import * as cheerio from 'cheerio';
import {v4 as uuid} from 'uuid'
import Cookie from "../../infrastructure/models/cookie.model";

export class AcademiaUserService {
    public static async loginAndGetCookies(correo: string, contrasenia: string): Promise<{}> {
        const academiaIssuer = await Issuer.discover('https://sso.utem.cl/auth/realms/utem')
        const client = new academiaIssuer.Client({ // Genera un link cliente para el flujo de autorización.
            client_id: 'academiaClient',
            client_secret: '36a42b74-eff1-40c4-b530-e5fd06332895',
        });

        let oauthUri = client.authorizationUrl({ // Genera el link de autorización sso
            redirect_uri: 'https://academia.utem.cl/sso',
            scope: 'openid',
            response_type: 'code',
            response_mode: 'fragment',
            nonce: uuid(),
            state: uuid(),
        })

        let loginResponse = await axios.get(oauthUri) // Redirige a la página de login de sso
        const cookies = loginResponse.headers['set-cookie'] // Obtiene las cookies de la página de login de sso
        let $ = cheerio.load(loginResponse.data) // Genera un lector html
        let loginPost = $('form[id="kc-form-login"]').attr('action')  // Obtiene el link de posteo de login de sso
        let tries = 0 // Intentos de login

        while(loginResponse.data.includes('You are already logged in.') === false && tries < 3){ // Intenta logearse hasta que se logee o se acaben los intentos
            try {
                loginResponse = await axios.post(loginPost, `username=${correo}&password=${contrasenia}`, { // Postea el formulario de login de sso
                    headers: {
                        Cookie: cookies.join(";"),
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    maxRedirects: 0,
                })

                if(loginResponse.data.includes('Action expired.') === true){ // Si la acción expiró, se vuelve a obtener el link de posteo de login de sso
                    $ = cheerio.load(loginResponse.data)
                    loginPost = $('form[id="kc-form-login"]').attr('action')
                }
            } catch (res) {
                if(res.response.status === 302){ // Si el posteo de login de sso redirige, se obtiene la respuesta
                    loginResponse = res.response
                    break
                }
            }
            tries++
        }

        if(loginResponse.data.includes('You are already logged in.') === false && loginResponse.status !== 302){ // Si no se logeó, se lanza un error
            throw GenericError.CREDENCIALES_INCORRECTAS
        }

        const urlParams = new URLSearchParams(loginResponse.headers.location.split('/sso#')[1]) // Obtiene los parámetros de la url de redirección

        const tokenSet = await client.grant({ // Obtiene el token de autorización
            grant_type: 'authorization_code',
            code: urlParams.get('code'),
            redirect_uri: 'https://academia.utem.cl/sso',
        })

        // Primero generamos una sesión en la academia.
        let academiaSessionCookies = (await axios.get('https://academia.utem.cl/', { // Obtiene las cookies de la academia
            withCredentials: true,
        })).headers['set-cookie'].map(it => Cookie.parse(it))

        // Ahora iniciamos sesión con el token en la academia.
        const postSsoResponse = await axios.post('https://academia.utem.cl/post-sso', `token=${tokenSet.access_token}`, {
            withCredentials: true,
            headers: {
                Cookie: academiaSessionCookies.map(it => it.raw).join(";"),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        if(`${postSsoResponse.data}` !== '200') {
            throw GenericError.CREDENCIALES_INCORRECTAS
        }

        let loginSsoResponse;
        try {
            loginSsoResponse = await axios.get('https://academia.utem.cl/login-sso', {
                withCredentials: true,
                headers: {
                    Cookie: academiaSessionCookies.map(it => it.raw).join(";"),
                },
                maxRedirects: 0,
            });
        } catch (error: any) {
            if(error.response.status === 302){
                loginSsoResponse = error.response
            } else {
                throw GenericError.CREDENCIALES_INCORRECTAS
            }
        }

        // Siempre va a ser redirigido al perfil!
        if(loginSsoResponse.status !== 302){
            throw GenericError.CREDENCIALES_INCORRECTAS
        }

        // Seguir redirección.
        const perfilResponse = await axios.get(loginSsoResponse.headers.location, {
            withCredentials: true,
            headers: {
                Cookie: academiaSessionCookies.map(it => it.raw).join(";"),
            }
        });
        if(`${perfilResponse.data}`.includes('Hola,') === false){
            throw GenericError.CREDENCIALES_INCORRECTAS
        }

        // Retorna solo las cookies.name y cookies.value en forma de objeto, así: { name: value }
        const cookiesResponse = {};
        academiaSessionCookies.forEach(it => cookiesResponse[it.name] = it.value)
        return cookiesResponse
    }
}
