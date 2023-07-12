import axios from "axios";
import * as cheerio from 'cheerio'

export class PasaportePasswordService {
    public static async resetPassword(correo: string): Promise<{ enviado: boolean, mensaje: string}> {
        const page = await axios.get(`${process.env.PASAPORTE_UTEM_URL}/reset`)
        const $ = cheerio.load(page.data);

        const csrftoken = $('input[name="csrf_token"]').val()

        try {
            await axios.post(`${process.env.PASAPORTE_UTEM_URL}/reset`, `email=${correo}&csrf_token=${csrftoken}`, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
        } catch {} // Ignorar error

        return {
            enviado: true,
            mensaje: 'Si el correo existe obtendrás un link para reiniciar tu contraseña. Revisa tu bandeja de entrada y spam.', // Esto debido a que algunas veces el sitio retorna error 500
        }
    }
}
