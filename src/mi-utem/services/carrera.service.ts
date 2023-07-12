import Carrera from "../../core/models/carrera.model";
import Cookie from "../../infrastructure/models/cookie.model";
import {MiUtemAuthService} from "./auth.service";
import axios from "axios";
import * as cheerio from "cheerio";

export class MiUtemCarreraService {
    public static async getCarreras(cookies: Cookie[]): Promise<Carrera[]> {
        await MiUtemAuthService.cookiesValidas(cookies)
        const mallaRequest = await axios.get(`${process.env.MI_UTEM_URL}/academicos/mi-malla`, {
            headers: {
                Cookie: Cookie.header(cookies),
            },
        })
        const $ = cheerio.load(mallaRequest.data)

        const carreras: Carrera[] = [];
        const carrerasCollapsableElement = $('#avance-malla > #accordion > div.collapse')
        $('#avance-malla > #accordion > div.div-card-avance').each((i, carreraCardElement) => {
            const datosCarrera = $(carreraCardElement).find('div > div > span.card-avance-left').text().split(' - ')
            const codigo = (datosCarrera[0] || '').trim()
            const nombre = (datosCarrera[1] || '').trim()
            const estado = $(carreraCardElement).find('div > div > span.card-avance-right').text().replace('Estado : ', '').trim()

            carreras.push({
                codigo,
                nombre,
                estado,
                plan: $(carrerasCollapsableElement[i]).find('div > div:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(3)').text().trim(),
            })
        })

        return carreras
    }
}
