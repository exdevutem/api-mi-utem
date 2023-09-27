import axios from "axios";
import Noticia from "../models/noticia.model";
import * as cheerio from 'cheerio'

export class UtemNoticiasService {
  static async getNoticias(porPagina: number, desde: string, hasta: string){
    const posts = await axios.get(`${process.env.UTEM_URL}/wp-json/wp/v2/posts?_embed&per_page=${porPagina}&before=${hasta}&after=${desde}`)
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

    return noticias
  }
}
