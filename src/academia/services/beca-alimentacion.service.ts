import Cookie from "../../infrastructure/models/cookie.model";
import {AcademiaUserService} from "./auth.service";
import GenericError from "../../infrastructure/models/error.model";
import axios from "axios";
import * as cheerio from 'cheerio';
import CodigoBecaAlimentacion from "../../core/models/codigo-beca-alimentacion.model";
import {dayjs} from "../../app";

export class BecaAlimentacionService {

  public static async obtenerCodigoAlimentacion(cookies: Cookie[]): Promise<CodigoBecaAlimentacion[]> {
    await AcademiaUserService.cookiesValidas(cookies);

    let becaAlimentacionResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion`, {
      headers: {
        Cookie: Cookie.header(cookies),
      },
    })

    if(becaAlimentacionResponse.data.includes('Actualmente, no posees la beca de alimentación UTEM, cualquier consulta, dirígete a bienestar estudiantil de tu sede.')) {
      throw GenericError.SIN_BECA_ALIMENTACION
    }

    let $ = cheerio.load(becaAlimentacionResponse.data);

    const codigos: CodigoBecaAlimentacion[] = [];

    $('#datatable > tbody > tr').each((index, it) => {
      const codigo = $(it).find('td:nth-child(1)').text();
      const validoPara = ($(it).find('td:nth-child(2)').text())
      const estado = $(it).find('td:nth-child(3)').text();

      try {
        codigos.push({ codigo, validoPara: dayjs(validoPara, 'DD-MM-YYYY').tz('America/Santiago').toISOString(), estado })
      } catch(_){}
    })

    console.debug({ codigos })

    return codigos
  }

  public static async generarCodigoAlimentacion(cookies: Cookie[], fechaInicio: string, fechaTermino: string): Promise<CodigoBecaAlimentacion[]> {
    await AcademiaUserService.cookiesValidas(cookies);

    // Revisar si tiene beca
    let becaAlimentacionResponse = await axios.get(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion`, {
      headers: {
        Cookie: Cookie.header(cookies),
      },
    })

    if(becaAlimentacionResponse.data.includes('Actualmente, no posees la beca de alimentación UTEM, cualquier consulta, dirígete a bienestar estudiantil de tu sede.')) {
      throw GenericError.SIN_BECA_ALIMENTACION
    }

    const desde = dayjs(fechaInicio, 'DD-MM-YYYY').tz('America/Santiago').startOf('day')
    const hasta = dayjs(fechaTermino, 'DD-MM-YYYY').tz('America/Santiago').endOf('day')

    // Generar codigo
    let responseCode: Number
    try {
      const response = await axios.post(`${process.env.ACADEMIA_UTEM_URL}/bienestar_estudiantil/beca_alimentacion/generar_cupon`, `txt_inicio=${desde.format('DD-MM-YYYY')}&txt_termino=${hasta.format('DD-MM-YYYY')}`, {
        headers: {
          Cookie: Cookie.header(cookies),
        },
        maxRedirects: 0,
      })

      responseCode = response.status
    } catch (err){
      responseCode = err?.response?.status || 0
    }

    if(responseCode !== 302) {
      throw GenericError.ERROR_GENERAR_CODIGO
    }

    // Obtiene los codigos y los filtra por fecha
    const codigos = await BecaAlimentacionService.obtenerCodigoAlimentacion(cookies)
    return codigos.filter(it => dayjs(it.validoPara).tz('America/Santiago').isSameOrAfter(desde, 'day') && dayjs(it.validoPara).tz('America/Santiago').isSameOrBefore(hasta, 'day'))
  }
}
