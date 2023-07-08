import {NextFunction, Request, Response} from "express";
import GenericError from "../../infrastructure/models/error.model";
import CredentialsUtils from "../../infrastructure/utils/credentials.utils";
import {SigaApiAuthService} from "../../siga-api/services/auth.service";
import Usuario from "../models/usuario.model";
import {MiUtemAuthService} from "../../mi-utem/services/auth.service";

export class AuthController {
    public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const correo: string = req.body.correo;
            const contrasenia: string = req.body.contrasenia;

            let usuarioSiga: Usuario;
            let sigaToken: string;
            try {
                usuarioSiga = await SigaApiAuthService.loginAndGetProfile(correo, contrasenia);
                sigaToken = usuarioSiga.token;
            } catch (error) {
                if (error.response?.status === 401) {
                    throw GenericError.CREDENCIALES_INCORRECTAS;
                }
                throw error;
            }

            const cookies = await MiUtemAuthService.loginAndGetCookies(correo, contrasenia)

            let usuarioMiUtem: Usuario;

            let genericError: GenericError = GenericError.SIGA_UTEM_ERROR;
            if (sigaToken) {
                const usuarioToken: Usuario = CredentialsUtils.getSigaUser(sigaToken);

                const usuario: Usuario = {...usuarioSiga, ...usuarioToken};
                usuario.token = CredentialsUtils.createToken(sigaToken, cookies);

                genericError = GenericError.SIN_ROL;

                if (usuarioSiga.perfiles?.length) {
                    genericError = GenericError.NO_ESTUDIANTE;
                    if (usuarioSiga.perfiles.includes("Estudiante")) {
                        genericError = null;

                        res.status(200).json({
                            ...usuario,
                            ...{
                                fotoUrl: usuarioMiUtem?.fotoUrl,
                            },
                        });
                    }
                }
            }

            if (genericError == null) {
                throw genericError;
            }
        } catch (error) {
            next(error);
        }
    }
}
