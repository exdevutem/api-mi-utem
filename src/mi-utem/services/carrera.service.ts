import { Page, Request, SetCookie } from "puppeteer";
import { browser } from "../../app";
import Carrera from "../../core/models/carrera.model";
import GenericError from "../../infrastructure/models/error.model";

export class MiUtemCarreraService {
  public static async getCarreras(cookies: SetCookie[]): Promise<Carrera[]> {
    const page: Page = await browser.newPage();
    try {
      await page.setRequestInterception(true);
      page.on("request", (request: Request) => {
        if (
          ["image", "stylesheet", "font", "other", "xhr", "script"].includes(
            request.resourceType()
          )
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setCookie(...cookies);

      await page.goto(`${process.env.MI_UTEM_URL}/academicos/mi-malla`, {
        waitUntil: "networkidle2",
      });

      const url: string = await page.url();

      if (url.includes("sso.utem.cl")) {
        throw GenericError.MI_UTEM_EXPIRO;
      }

      const carreras: Carrera[] = await page.evaluate(() => {
        const carrerasCardSel: string =
          "#avance-malla > #accordion > div.div-card-avance";
        const carrerasCollapsableSel: string =
          "#avance-malla > #accordion > div.collapse";

        const carrerasCardEl: Element[] = Array.from(
          document.querySelectorAll(carrerasCardSel)
        );
        const carreraCollapsableEl: Element[] = Array.from(
          document.querySelectorAll(carrerasCollapsableSel)
        );

        const carreras: Carrera[] = carrerasCardEl.map(
          (carreraCardEl: Element, i: number): Carrera => {
            const nombreCodigosel: string = "div > div > span.card-avance-left";
            const estadoSel: string = "div > div > span.card-avance-right";
            const planSel: string =
              "div > div:nth-child(1) > div > table > tbody > tr:nth-child(1) > td:nth-child(3)";

            const nombreCodigoEl: Element =
              carreraCardEl.querySelector(nombreCodigosel);
            const estadoEl: Element = carreraCardEl.querySelector(estadoSel);
            const collapsableEl: Element = carreraCollapsableEl[i];

            const codigo: string = nombreCodigoEl.textContent
              .split(" - ")[0]
              .trim();
            const nombre: string = nombreCodigoEl.textContent
              .split(" - ")[1]
              .trim();
            const estado: string = estadoEl.textContent
              .replace("Estado : ", "")
              .trim();
            const plan: string = collapsableEl
              .querySelector(planSel)
              .textContent.trim();

            return {
              codigo,
              nombre,
              estado,
              plan,
            };
          }
        );

        return carreras;
      });

      return carreras;
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }
}
