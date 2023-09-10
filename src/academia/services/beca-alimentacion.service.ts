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

    let $ = cheerio.load(becaAlimentacionResponse.data);

    // Generar codigo
    try {
      const txt_inicio = $('input[name="txt_inicio"]').val()
      const txt_termino = $('input[name="txt_termino"]').val()
      await axios.post(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion/generar_cupon`, {
        txt_inicio,
        txt_termino,
      }, {
        headers: {
          Cookie: Cookie.header(cookies),
        },
      })
    } catch (_){}

    // Obtener codigo
    becaAlimentacionResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion`, {
      headers: {
        Cookie: Cookie.header(cookies),
      },
    })

    $ = cheerio.load(becaAlimentacionResponse.data);

    const codigo = $('#datatable > tbody > tr > td:nth-child(1)').text()
    if(!codigo) {
      throw GenericError.SIN_CODIGO_BECA_ALIMENTACION
    }

    if(codigo === 'No hay cupones generados.') {
      throw GenericError.FUERA_DE_HORARIO_BECA_ALIMENTACION // Si al generar codigo, no aparece nada, significa que estamos fuera de horario.
    }

    return codigo
  }
}
