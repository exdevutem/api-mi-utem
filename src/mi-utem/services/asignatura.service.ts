import { Page, Request, SetCookie } from "puppeteer";
import { browser } from "../../app";
import Evaluacion from "../../core/models/evaluacion.model";
import SeccionAsignatura from "../../core/models/seccion-asignatura.model";
import Semestre from "../../core/models/semestre.model";
import Usuario from "../../core/models/usuario.model";
import GenericError from "../../infrastructure/models/error.model";

export class MiUtemAsignaturaService {
  public static async getAsignaturas(
    cookies: SetCookie[]
  ): Promise<SeccionAsignatura[]> {
    const page: Page = await browser.newPage();
    try {
      const tiposUsuarioSel: string =
        "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div > span";
      const estudiantePerfilSel: string =
        "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none >div[value='Estudiante']";
      const notasButtonSel: string = "#btn-mdl-notas";

      await page.setRequestInterception(true);
      page.on("request", (request: Request) => {
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

      await page.goto(`${process.env.MI_UTEM_URL}`, {
        waitUntil: "networkidle2",
      });

      try {
        await page.waitForSelector(estudiantePerfilSel, {
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

      await page.click(estudiantePerfilSel);
      await page.waitForSelector(notasButtonSel);

      const asignaturas: SeccionAsignatura[] = await page.evaluate(() => {
        const asignaturasSel: string =
          ".card-utem #table_mdl_titulo tbody tr.no-border";

        const asignaturasEl: Element[] = Array.from(
          document?.querySelectorAll(asignaturasSel)
        );

        const columnasPrimeraFila: Element[] = Array.from(
          document?.querySelectorAll(".card-utem #table_mdl_titulo thead tr td")
        );

        if (asignaturasEl.length > 0) {
          return asignaturasEl?.map((a) => {
            return {
              codigo: a
                .querySelector("td:nth-child(1) > span")
                ?.textContent.split(" - ")[0]
                ?.trim(),
              nombre: a
                .querySelector("td:nth-child(1) > span")
                ?.textContent.split(" - ")[1]
                ?.trim(),
              tipoHora: a
                .querySelector("td:nth-child(2) > span")
                ?.textContent?.trim(),
            };
          });
        } else {
          return [];
        }
      });

      return asignaturas;
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }

  public static async getDetalleAsignatura(
    cookies: SetCookie[],
    codigoAsignatura: string
  ): Promise<SeccionAsignatura> {
    const page: Page = await browser.newPage();
    try {
      const tiposUsuarioSel: string =
        "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div > span";
      const estudiantePerfilSel: string =
        "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div[value='Estudiante']";
      const notasButtonSel: string = "#btn-mdl-notas";
      const graficoAsistenciaSel: string = "#hit-rate-doughnut";

      await page.setRequestInterception(true);
      page.on("request", (request: Request) => {
        if (["image", "font", "other"].includes(request.resourceType())) {
          request.abort();
        } else if (
          request.resourceType() == "xhr" &&
          !request.url().endsWith("get-data-detalle-asignatura")
        ) {
          request.abort();
        } else if (
          request.resourceType() == "stylesheet" &&
          !request.url().endsWith("font-awesome.css")
        ) {
          request.abort();
        } else if (
          request.resourceType() == "script" &&
          !request.url().includes("home_alumnos.js") &&
          !request.url().includes("jquery/jquery-3")
        ) {
          request.continue();
        } else {
          request.continue();
        }
      });

      await page.setCookie(...cookies);

      await page.goto(`${process.env.MI_UTEM_URL}`, {
        waitUntil: "networkidle2",
      });

      try {
        await page.waitForSelector(tiposUsuarioSel, {
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

      await page.click(estudiantePerfilSel);
      await page.waitForSelector(notasButtonSel);

      const detalleBotonSel: string = await page.evaluate(
        (codigoAsignatura: string) => {
          const asignaturasSel: string =
            ".card-utem #table_mdl_titulo tbody tr";

          const asignaturasEl: Element[] = Array.from(
            document?.querySelectorAll(asignaturasSel)
          );

          const columnasPrimeraFila: Element[] = Array.from(
            document?.querySelectorAll(
              ".card-utem #table_mdl_titulo thead tr td"
            )
          );

          if (asignaturasEl.length > 0) {
            for (let i = 0; i < asignaturasEl.length; i++) {
              const asignaturaEl: Element = asignaturasEl[i];
              const codigo: string = asignaturaEl
                .querySelector("td:nth-child(1) > span")
                ?.textContent.split(" - ")[0]
                ?.trim();
              if (codigoAsignatura?.toUpperCase() == codigo?.toUpperCase()) {
                const detalleBotonSel: string = "td:nth-child(3) > span";
                return `${asignaturasSel}:nth-child(${
                  i + 1
                }) ${detalleBotonSel}`;
              }
            }
            return null;
          } else {
            return null;
          }
        },
        codigoAsignatura
      );

      if (detalleBotonSel) {
        await page.click(detalleBotonSel);
        await page.waitForSelector(graficoAsistenciaSel);

        const asignatura: SeccionAsignatura = await page.evaluate(() => {
          const docenteSel: string =
            "#TABLA1 > div:nth-child(1) > div > div > div > div > div:nth-child(2) > span";
          const tipoAsignaturaSel: string =
            "#TABLA1 > div:nth-child(1) > div > div:nth-child(2) > div > div > div:nth-child(2) > span";
          const tipoHoraSel: string =
            "#TABLA1 > div:nth-child(1) > div > div:nth-child(3) > div > div > div:nth-child(2) > span";
          const horarioSel: string =
            "#TABLA1 > div:nth-child(1) > div > div:nth-child(4) > div > div > div.col-lg-10.text-uppercase";
          const intentosSel: string =
            "#TABLA1 > div:nth-child(1) > div > div > div > div > div:nth-child(4) > span";
          const salaSel: string =
            "#TABLA1 > div:nth-child(1) > div > div:nth-child(2) > div > div > div:nth-child(4) > span";
          const seccionSel: string =
            "#TABLA1 > div:nth-child(1) > div > div:nth-child(3) > div > div > div:nth-child(4) > span";
          const asistenciaSinRegistroSel: string = "#clas_noreg";
          const asistenciaAsistidaSel: string = "#clas_asi";
          const asistenciaTotalSel: string = "#clas_total";
          const filaEstudianteSel: string = "#table-estudiantes > tbody > tr";

          let docente: string = document
            .querySelector(docenteSel)
            ?.textContent?.trim();
          docente = docente == "None" ? null : docente;

          const tipoAsignatura: string = document
            .querySelector(tipoAsignaturaSel)
            ?.textContent?.trim();
          const tipoHora: string = document
            .querySelector(tipoHoraSel)
            ?.textContent?.trim();
          const horario: string = document
            .querySelector(horarioSel)
            ?.textContent.split("/")
            ?.map((e) => e?.trim())
            .filter((e) => e && e != "")
            .join(" / ")
            ?.trim();
          const intentos: number = parseInt(
            document.querySelector(intentosSel)?.textContent?.trim()
          );
          const sala: string = document
            .querySelector(salaSel)
            ?.textContent?.trim();
          const seccion: string = document
            .querySelector(seccionSel)
            ?.textContent?.trim();

          let asistenciaSinRegistro: number = parseInt(
            document
              .querySelector(asistenciaSinRegistroSel)
              ?.textContent?.trim()
          );
          asistenciaSinRegistro =
            asistenciaSinRegistro >= 0 ? asistenciaSinRegistro : 0;

          let asistenciaAsistida: number = parseInt(
            document.querySelector(asistenciaAsistidaSel)?.textContent?.trim()
          );
          asistenciaAsistida = asistenciaAsistida >= 0 ? asistenciaAsistida : 0;

          let asistenciaTotal: number = parseInt(
            document.querySelector(asistenciaTotalSel)?.textContent?.trim()
          );
          asistenciaTotal = asistenciaTotal >= 0 ? asistenciaTotal : 0;

          const filasEstudiantesEls: Element[] = Array.from(
            document?.querySelectorAll(filaEstudianteSel)
          );
          const estudiantes: Usuario[] = filasEstudiantesEls?.map(
            (filaEstudianteEl) => {
              const nombre: string = filaEstudianteEl
                .querySelector("td:nth-child(2)")
                ?.textContent?.trim();
              let nombreCompleto, nombres, apellidos: string;

              if (nombre.includes(",")) {
                nombres = nombre.split(", ")[1]?.trim();
                apellidos = nombre.split(", ")[0]?.trim();
              } else {
                nombreCompleto = nombre?.trim();
              }
              const correo: string = filaEstudianteEl
                .querySelector("td:nth-child(3)")
                ?.textContent?.trim();
              return { nombreCompleto, nombres, apellidos, correo };
            }
          );

          return {
            docente,
            tipoAsignatura,
            tipoHora,
            horario,
            intentos,
            sala,
            seccion,
            estudiantes,
            asistencia: {
              total: asistenciaTotal,
              asistida: asistenciaAsistida,
              sinRegistro: asistenciaSinRegistro,
            },
          };
        });

        return asignatura;
      } else {
        throw GenericError.ASIGNATURA_NO_ENCONTRADA;
      }
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }

  public static async getAsignaturasHistoricas(
    cookies: SetCookie[],
    soloAsignaturas: boolean = false
  ): Promise<Semestre[] | SeccionAsignatura[]> {
    const page: Page = await browser.newPage();
    try {
      const semestreSel: string = "#accordion > .collapse";

      await page.setRequestInterception(true);
      page.on("request", (request: Request) => {
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
        `${process.env.MI_UTEM_URL}/academicos/mi-bitacora-notas`,
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

      const semestres: Semestre[] = await page.evaluate(() => {
        const semestreSel: string = "#accordion > .div-card-notas";
        const tablaNotasSel: string = "#accordion > .collapse";

        const tablasNotas: Element[] = Array.from(
          document.querySelectorAll(tablaNotasSel)
        );

        const semestres: Semestre[] = tablasNotas.map((tablaNotas, i) => {
          const filasHeadSel: string = "div > div > div > table > thead > tr";
          const filasHead: Element[] = Array.from(
            tablaNotas.querySelectorAll(filasHeadSel)
          );

          const filasBodySel: string = "div > div > div > table > tbody > tr";
          const filasBody: Element[] = Array.from(
            tablaNotas.querySelectorAll(filasBodySel)
          );

          let secciones = filasBody.map((fila: Element): SeccionAsignatura => {
            const columnas: Element[] = Array.from(fila.querySelectorAll("td"));
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
              const notaFinalInputEl: Element =
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

              const columnasEvaluaciones: Element[] = columnas.slice(3, -3);
              notasParciales = columnasEvaluaciones.map(
                (columnaEvaluacion: Element, i: number): Evaluacion => {
                  const porcentajeSel: string = ".z > b";
                  const notaSel: string = ".z > .x > .y";

                  const porcentaje: number = parseInt(
                    columnaEvaluacion
                      .querySelector(porcentajeSel)
                      ?.textContent.trim()
                      .replace("%", "")
                  );
                  const nota: number = parseFloat(
                    columnaEvaluacion.querySelector(notaSel)?.textContent.trim()
                  );

                  if (nota || porcentaje) {
                    if (porcentaje && nota) {
                      return { porcentaje, nota };
                    } else {
                      return {
                        porcentaje,
                        nota: null,
                      };
                    }
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
            descripcion: Array.from(document.querySelectorAll(semestreSel))[
              i
            ]?.textContent.trim(),
            secciones,
          };
        });

        return semestres;
      });

      if (soloAsignaturas) {
        let asignaturas: SeccionAsignatura[] = [];
        semestres.map((s: Semestre) => {
          asignaturas = [...asignaturas, ...s.secciones];
        });
        return asignaturas;
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
