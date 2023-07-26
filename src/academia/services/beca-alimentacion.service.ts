import Cookie from "../../infrastructure/models/cookie.model";
import {AcademiaUserService} from "./auth.service";
import GenericError from "../../infrastructure/models/error.model";
import axios from "axios";
import * as cheerio from 'cheerio';

export class BecaAlimentacionService {

  public static async generarCodigoAlimentacion(cookies: Cookie[]): Promise<string> {
    await AcademiaUserService.cookiesValidas(cookies);

    // Revisar si tiene beca
    let becaAlimentacionResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion`, {
      headers: {
        Cookie: Cookie.header(cookies),
      },
    })

    if(!becaAlimentacionResponse.data.includes('te informamos que obtuviste la beca de alimentos UTEM, por lo que debes imprimir tus cupones para almorzar en el casino de tu campus.')) {
      throw GenericError.SIN_BECA_ALIMENTACION
    }

    // Generar codigo
    try {
      await axios.post(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion/generar_cupon`, {
        headers: {
          Cookie: Cookie.header(cookies),
        },
        maxRedirects: 0,
      })
    } catch (_){}

    // Obtener codigo
    becaAlimentacionResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion`, {
      headers: {
        Cookie: Cookie.header(cookies),
      },
    })

    const $ = cheerio.load(becaAlimentacionResponse.data);

    const codigo = $('#datatable > tbody > tr > td:nth-child(1)').text()
    if(!codigo) {
      throw GenericError.SIN_CODIGO_BECA_ALIMENTACION
    }

    return codigo
  }
}
