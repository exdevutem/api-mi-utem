import axios from "axios";
import Noticia from "../models/noticia.model";
import * as cheerio from 'cheerio'
import {HashUtils} from "../../infrastructure/utils/hash.utils";
import {cache} from "../../app";
import randomUseragent from 'random-useragent';

export class UtemNoticiasService {
  static async getNoticias(porPagina: number, desde: string, hasta: string){
    const cacheKey = HashUtils.sha512(`noticias:${porPagina}:${desde}:${hasta}`)
    const cached = cache.get<Noticia[]>(cacheKey)
    if(cached != undefined) {
      return cached;
    }

    const posts = await axios.get(`${process.env.NOTICIAS_UTEM_URL}/wp-json/wp/v2/posts?_embed&per_page=${porPagina}&before=${hasta}&after=${desde}`, {
      headers: {
        'User-Agent': randomUseragent.getRandom(),
      }
    })
    const noticias: Noticia[] = []

    for (const post of posts.data) {
      const $ = cheerio.load(post.excerpt.rendered)
      let imagen: string;
      try {
        imagen = post._embedded['wp:featuredmedia'][0].source_url
      } catch (_) {
        imagen = "https://noticias.utem.cl/wp-content/uploads/2017/07/en-preparacion.jpg"
      }

      const noticia: Noticia = {
        id: post.id,
        fecha: `${post.date_gmt}Z`,
        titulo: post.title.rendered,
        subtitulo: $.text().trim(),
        link: post.link,
        imagen,
      }
      noticias.push(noticia)
    }

    cache.set(cacheKey, noticias, 900) // 15 minutos
    return noticias;
  }
}
