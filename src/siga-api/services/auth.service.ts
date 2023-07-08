import axios from "axios";
import Usuario from "../../core/models/usuario.model";

export class SigaApiAuthService {
    public static async loginAndGetProfile(correo: string, contrasenia: string): Promise<Usuario> {
        const res = await axios.post(`${process.env.SIGA_API_URL}/atenticacion/login`, `username=${correo}&password=${contrasenia}`, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Host: "siga.utem.cl",
            },
        });

        return {
            token: res.data.response.token,
            rut: res.data.response.datos_persona.rut,
            nombreCompleto: res.data.response.datos_persona.nombre_completo,
            correoPersonal: res.data.response.datos_persona.correo_personal,
            correoUtem: res.data.response.datos_persona.correo_utem,
            fotoBase64: res.data.response.datos_persona.foto,
            perfiles: res.data.response.datos_persona.perfiles,
        };
    }
}
