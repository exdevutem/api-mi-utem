require("dotenv").config();

const puppeteer = require("puppeteer");
const MiUtemError = require("../utils/errors");

const ref = process.env.REQ_REF ? `?ref=${process.env.REQ_REF}` : "";

const obtenerHorario = async (req, res, next) => {
  let browser = null;
  try {
    const tablaHorarioSel = "#tabla-cursos-dictados";

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true,
    });
    const page = await browser.newPage();

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

    // @ts-ignore
    await page.setCookie(...req.cookies);

    await page.goto(`${process.env.MI_UTEM_URL}/academicos/mi-horario${ref}`, {
      waitUntil: "networkidle2",
    });

    try {
      await page.waitForSelector(tablaHorarioSel, {
        timeout: 5000,
      });
    } catch (error) {
      const url = await page.url();
      if (url.startsWith(`${process.env.MI_UTEM_URL}`)) {
        next(error);
      } else {
        next(MiUtemError.SESION_EXPIRADA);
      }
    }

    const horario = await page.evaluate(() => {
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
              const seccion = seccionSala?.split("(")[0]?.trim();;
              const sala = seccionSala?.split("(")[1].replace(")", "")?.trim();;
              return { codigo, seccion, sala, tipoHora };
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
        const dias = headerHorario.map((dia, i) => dia.textContent);

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
      res.status(200).send(horario);
    } else {
      next(MiUtemError.HORARIO_NO_ENCONTRADO);
    }
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

module.exports = { obtenerHorario };
