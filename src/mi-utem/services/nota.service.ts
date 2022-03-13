import { Page, SetCookie } from "puppeteer";
import { browser } from "../../app";
import Evaluacion from "../../core/models/evaluacion.model";
import SeccionAsignatura from "../../core/models/seccion-asignatura.model";
import Semestre from "../../core/models/semestre.model";
import GenericError from "../../infrastructure/models/error.model";

export class MiUtemNotaService {
  public static async obtenerSeccionesHistoricas(
    cookies: SetCookie[],
    soloNotas: boolean = true
  ): Promise<SeccionAsignatura[] | Semestre[]> {
    const page: Page = await browser.newPage();
    try {
      const semestreSel = "#accordion > .collapse";

      await page.setRequestInterception(true);
      page.on("request", (request) => {
        if (
          ["image", "stylesheet", "font", "script", "other", "xhr"].includes(
            request.resourceType()
          )
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setCookie(...cookies);

      await page.goto(
        `${process.env.MI_UTEM_URL}/academicos/mi-bitacora-notas${ref}`,
        { waitUntil: "networkidle2" }
      );

      try {
        await page.waitForSelector(semestreSel, {
          timeout: 5000,
        });
      } catch (error) {
        const url: string = await page.url();
        if (url.startsWith(`${process.env.MI_UTEM_URL}`)) {
          throw error;
        } else {
          throw GenericError.MI_UTEM_EXPIRO;
        }
      }

      const semestres = await page.evaluate(() => {
        const semestreSel = "#accordion > .div-card-notas";
        const tablaNotasSel = "#accordion > .collapse";

        const tablasNotas = Array.from(
          document.querySelectorAll(tablaNotasSel)
        );

        const semestres: Semestre[] = tablasNotas.map((tablaNotas, i) => {
          const filasHeadSel = "div > div > div > table > thead > tr";
          const filasHead = Array.from(
            tablaNotas.querySelectorAll(filasHeadSel)
          );

          const filasBodySel = "div > div > div > table > tbody > tr";
          const filasBody = Array.from(
            tablaNotas.querySelectorAll(filasBodySel)
          );

          let seccionesConNotas: SeccionAsignatura[] = filasBody.map((fila) => {
            const columnas: HTMLTableCellElement[] = Array.from(
              fila.querySelectorAll("td")
            );
            const codigo: string = columnas[1]?.textContent
              .split(" ")[0]
              .trim();

            const nombre: string = columnas[1]?.textContent
              .split(" ")
              .slice(1)
              .join(" ")
              .trim();
            const tipoHora: string = columnas[2]?.textContent;

            let estado: string;
            let notaExamen: number;
            let notaPresentacion: number;
            let notaFinal: number;
            let notasParciales: Evaluacion[] = [];

            if (filasBody.length >= filasHead.length) {
              const notaFinalInputEl =
                columnas[columnas.length - 1].querySelector("input");

              notaFinal = notaFinalInputEl
                ? parseFloat(
                    notaFinalInputEl.getAttribute("value").replace(",", ".")
                  )
                : null;
              notaExamen = parseFloat(
                columnas[columnas.length - 3]?.textContent
                  .trim()
                  .replace(",", ".")
              );
              notaPresentacion = parseFloat(
                columnas[columnas.length - 2]?.textContent
                  .trim()
                  .replace(",", ".")
              );

              if (
                notaFinalInputEl &&
                notaFinalInputEl.classList.contains("input_success")
              ) {
                estado = "Aprobado";
              } else if (
                notaFinalInputEl &&
                notaFinalInputEl.classList.contains("input_danger")
              ) {
                estado = "Reprobado";
              } else {
                estado = "Inscrito";
              }

              const columnasEvaluaciones = columnas.slice(3, -3);
              notasParciales = columnasEvaluaciones.map(
                (columnaEvaluacion, i) => {
                  const porcentajeSel = ".z > b";
                  const notaSel = ".z > .x > .y";

                  const porcentaje = parseInt(
                    columnaEvaluacion
                      .querySelector(porcentajeSel)
                      ?.textContent.trim()
                      .replace("%", "")
                  );
                  const nota = parseFloat(
                    columnaEvaluacion.querySelector(notaSel)?.textContent.trim()
                  );

                  if (nota || porcentaje) {
                    return { porcentaje, nota };
                  } else {
                    return null;
                  }
                }
              );
              notasParciales = notasParciales.filter((n) => n != null);
            }

            return {
              codigo,
              nombre,
              tipoHora,
              estado,
              notasParciales,
              notaExamen,
              notaPresentacion,
              notaFinal,
            };
          });
          return {
            semestre: Array.from(document.querySelectorAll(semestreSel))[
              i
            ]?.textContent.trim(),
            secciones: seccionesConNotas,
          };
        });

        return semestres;
      });

      if (soloNotas) {
        let secciones: SeccionAsignatura[] = [];
        semestres.map((s) => {
          secciones = [...secciones, ...s.secciones];
        });
        return secciones;
      } else {
        return semestres;
      }
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }
}
