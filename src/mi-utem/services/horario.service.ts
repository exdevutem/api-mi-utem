import { Page, SetCookie } from "puppeteer";
import { browser } from "../../app";
import Horario from "../../core/models/horario.model";
import GenericError from "../../infrastructure/models/error.model";

export class MiUtemHorarioService {
  public static async getHorarioByCarrera(
    cookies: SetCookie[],
    codigoCarrera: string
  ): Promise<Horario> {
    const tablaHorarioSel: string = "#tabla-cursos-dictados";

    const page: Page = await browser.newPage();
    try {
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

      await page.goto(`${process.env.MI_UTEM_URL}/academicos/mi-horario`, {
        waitUntil: "networkidle2",
      });

      try {
        await page.waitForSelector(tablaHorarioSel, {
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

      const horario: Horario = await page.evaluate(() => {
        const asignaturasTablaSel = "#tabla-cursos-dictados";
        const horarioTablaSel =
          "#accordion > div > div > table.tabla-horario-rounded";

        const asignaturasTablaEl = document.querySelector(asignaturasTablaSel);
        const horarioTablaEl = document.querySelector(horarioTablaSel);

        if (horarioTablaEl) {
          const filasSel = "tbody tr";

          const asinaturasFilas = Array.from(
            asignaturasTablaEl.querySelectorAll(filasSel)
          );
          const asignaturas = asinaturasFilas.map((fila) => {
            const columnas = Array.from(fila.querySelectorAll("td"));
            return {
              codigo: columnas[0]?.textContent?.trim(),
              nombre: columnas[1]?.textContent?.trim(),
              docente: columnas[2]?.textContent?.trim(),
              tipoHora: columnas[3]?.textContent?.trim(),
              seccion: columnas[4]?.textContent?.trim(),
            };
          });

          const horarioFilas = Array.from(
            horarioTablaEl.querySelectorAll(filasSel)
          );
          const horarioTraspuesto = horarioFilas.map((fila) => {
            const columnas = Array.from(fila.querySelectorAll("td"));
            const columnasDias = columnas.slice(2);
            return columnasDias.map((bloque, i) => {
              const bloqueTexto = bloque.textContent?.trim();
              if (bloqueTexto && bloqueTexto != null) {
                const codigoTipoHora = bloqueTexto?.split("Sala:")[0]?.trim();
                const codigo = codigoTipoHora?.split("/")[0].trim();
                const tipoHora = codigoTipoHora?.split("/")[1]?.trim();

                const seccionSala = bloqueTexto?.split("Sala:")[1]?.trim();
                const seccion = seccionSala?.split("(")[0]?.trim();
                const sala = seccionSala
                  ?.split("(")[1]
                  .replace(")", "")
                  ?.trim();
                return { asignatura: { tipoHora, codigo, seccion }, sala };
              } else {
                return null;
              }
            });
          });

          let horario = horarioTraspuesto;
          /* let horario = []
          for (let i = 0; i < horarioTraspuesto.length; i++) {
              for (let j = 0; j < horarioTraspuesto[i].length; j++) {
                  const periodo = horarioTraspuesto[i][j];
                  if (!horario[j]) {
                      horario[j] = [];
                  }
                  horario[j].push(periodo);
              }
          } */

          const headerHorario = Array.from(
            horarioTablaEl.querySelectorAll("thead th")
          ).slice(2);
          const dias = headerHorario.map((dia, i) => dia.textContent.trim());

          let periodos = horarioFilas.map((fila, i) => {
            if (i % 2 == 0) {
              const columnas = Array.from(fila.querySelectorAll("td"));
              const periodo = columnas[0];
              const bloqueActual = columnas[1];
              const bloqueSiguiente = Array.from(
                horarioFilas[i + 1].querySelectorAll("td")
              )[1];

              const periodoTexto = periodo.textContent?.trim();
              const bloqueActualTexto = bloqueActual.textContent?.trim();
              const bloqueSiguienteTexto = bloqueSiguiente.textContent?.trim();
              const horaInicio = bloqueActualTexto?.split("-")[0];
              const horaIntermedio = bloqueActualTexto?.split("-")[1];
              const horaTermino = bloqueSiguienteTexto?.split("-")[1];

              return {
                numero: periodoTexto,
                horaInicio,
                horaIntermedio,
                horaTermino,
              };
            } else {
              return null;
            }
          });
          periodos = periodos.filter((p) => p != null);

          return { asignaturas, horario, dias, periodos };
        } else {
          return null;
        }
      });

      if (horario) {
        return horario;
      } else {
        throw GenericError.HORARIO_NO_ENCONTRADO;
      }
    } catch (error) {
      throw error;
    } finally {
      page.close();
    }
  }
}
