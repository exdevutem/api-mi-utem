require('dotenv').config()

const puppeteer = require("puppeteer");
const MiUtemError = require("../utils/errors");

const ref = process.env.REQ_REF ? `?ref=${process.env.REQ_REF}` : '';

const obtenerAsignaturas = async (req, res, next) => {
  let browser = null;
  try {
    const tiposUsuarioSel =
      "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div > span";
    const estudiantePerfilSel =
      "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none >div[value='Estudiante']";
    const notasButtonSel = "#btn-mdl-notas";

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true
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
        //console.log(request.resourceType(), request.url());
        request.continue();
      }
    });

    // @ts-ignore
    await page.setCookie(...req.cookies);

    await page.goto(`${process.env.MI_UTEM_URL}${ref}`, { waitUntil: "networkidle2" });

    try {
      await page.waitForSelector(estudiantePerfilSel, {
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

    await page.click(estudiantePerfilSel);
    await page.waitForSelector(notasButtonSel);

    const asignaturas = await page.evaluate(() => {
      const asignaturasSel = ".card-utem #table_mdl_titulo tbody tr.no-border";

      const asignaturasEl = Array.from(
        document?.querySelectorAll(asignaturasSel)
      );

      const columnasPrimeraFila = Array.from(
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

    res.status(200).send(asignaturas);
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const obtenerDetalleAsignatura = async (req, res, next) => {
  let browser = null;
  try {
    const tiposUsuarioSel =
      "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div > span";
    const estudiantePerfilSel =
      "body > div.page-container > div.header > div:nth-child(2) > div.search-link.d-lg-inline-block.d-none > div[value='Estudiante']";
    const notasButtonSel = "#btn-mdl-notas";
    const graficoAsistenciaSel = "#hit-rate-doughnut";

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
      headless: true
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (request) => {
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
        //console.log(request.resourceType(), request.url());
        request.continue();
      }
      
    });

    // @ts-ignore
    await page.setCookie(...req.cookies);

    await page.goto(`${process.env.MI_UTEM_URL}${ref}`, { waitUntil: "networkidle2" });

    try {
      await page.waitForSelector(tiposUsuarioSel, {
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

    await page.click(estudiantePerfilSel);
    await page.waitForSelector(notasButtonSel);

    const detalleBotonSel = await page.evaluate((codigoAsignatura) => {
      const asignaturasSel = ".card-utem #table_mdl_titulo tbody tr";

      const asignaturasEl = Array.from(
        document?.querySelectorAll(asignaturasSel)
      );

      const columnasPrimeraFila = Array.from(
        document?.querySelectorAll(".card-utem #table_mdl_titulo thead tr td")
      );


      if (asignaturasEl.length > 0) {
        for (let i = 0; i < asignaturasEl.length; i++) {
          const asignaturaEl = asignaturasEl[i];
          const codigo = asignaturaEl
            .querySelector("td:nth-child(1) > span")
            ?.textContent.split(" - ")[0]
            ?.trim();
          if (codigoAsignatura?.toUpperCase() == codigo?.toUpperCase()) {
            const detalleBotonSel =
              "td:nth-child(3) > span";
            return `${asignaturasSel}:nth-child(${i + 1}) ${detalleBotonSel}`;
          }
        }
        return null;
      } else {
        return null;
      }
    }, req.params.codigoAsignatura);

    if (detalleBotonSel) {
        await page.click(detalleBotonSel);
    await page.waitForSelector(graficoAsistenciaSel);

    const asignatura = await page.evaluate(() => {
      const docenteSel =
        "#TABLA1 > div:nth-child(1) > div > div > div > div > div:nth-child(2) > span";
      const tipoAsignaturaSel =
        "#TABLA1 > div:nth-child(1) > div > div:nth-child(2) > div > div > div:nth-child(2) > span";
      const tipoHoraSel =
        "#TABLA1 > div:nth-child(1) > div > div:nth-child(3) > div > div > div:nth-child(2) > span";
      const horarioSel =
        "#TABLA1 > div:nth-child(1) > div > div:nth-child(4) > div > div > div.col-lg-10.text-uppercase";
      const intentosSel =
        "#TABLA1 > div:nth-child(1) > div > div > div > div > div:nth-child(4) > span";
      const salaSel =
        "#TABLA1 > div:nth-child(1) > div > div:nth-child(2) > div > div > div:nth-child(4) > span";
      const seccionSel =
        "#TABLA1 > div:nth-child(1) > div > div:nth-child(3) > div > div > div:nth-child(4) > span";
      const asistenciaSinRegistroSel = "#clas_noreg";
      const asistenciaAsistidaSel = "#clas_asi";
      const asistenciaTotalSel = "#clas_total";
      const filaEstudianteSel = "#table-estudiantes > tbody > tr";

      const docente = document.querySelector(docenteSel)?.textContent?.trim();
      const tipoAsignatura = document
        .querySelector(tipoAsignaturaSel)
        ?.textContent?.trim();
      const tipoHora = document.querySelector(tipoHoraSel)?.textContent?.trim();
      const horario = document
        .querySelector(horarioSel)
        ?.textContent.split("/")
        ?.map((e) => e?.trim())
        .filter((e) => e && e != "")
        .join(" / ")
        ?.trim();
      const intentos = parseInt(
        document.querySelector(intentosSel)?.textContent?.trim()
      );
      const sala = document.querySelector(salaSel)?.textContent?.trim();
      const seccion = document.querySelector(seccionSel)?.textContent?.trim();

      let asistenciaSinRegistro = parseInt(
        document.querySelector(asistenciaSinRegistroSel)?.textContent?.trim()
      );
      asistenciaSinRegistro =
        asistenciaSinRegistro >= 0 ? asistenciaSinRegistro : 0;

      let asistenciaAsistida = parseInt(
        document.querySelector(asistenciaAsistidaSel)?.textContent?.trim()
      );
      asistenciaAsistida = asistenciaAsistida >= 0 ? asistenciaAsistida : 0;

      let asistenciaTotal = parseInt(
        document.querySelector(asistenciaTotalSel)?.textContent?.trim()
      );
      asistenciaTotal = asistenciaTotal >= 0 ? asistenciaTotal : 0;

      const filasEstudiantesEls = Array.from(
        document?.querySelectorAll(filaEstudianteSel)
      );
      const estudiantes = filasEstudiantesEls?.map((filaEstudianteEl) => {
        const nombres = filaEstudianteEl
          .querySelector("td:nth-child(2)")
          ?.textContent.split(", ")[1]
          ?.trim();
        const apellidos = filaEstudianteEl
          .querySelector("td:nth-child(2)")
          ?.textContent.split(", ")[0]
          ?.trim();
        const correo = filaEstudianteEl
          .querySelector("td:nth-child(3)")
          ?.textContent?.trim();
        return { nombres, apellidos, correo };
      });

      return {
        docente,
        tipoAsignatura,
        tipoHora,
        horario,
        intentos,
        sala,
        tipoSala: "",
        seccion,
        estudiantes,
        asistencia: {
          total: asistenciaTotal,
          asistida: asistenciaAsistida,
          sinRegistro: asistenciaSinRegistro,
        },
      };
    });

      res.status(200).send(asignatura);
    } else {
      next(MiUtemError.ASIGNATURA_NO_ENCONTRADA);
    }
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

const obtenerNotasPorCodigo = async (req, res, next) => {
  let browser = null;
  try {
    const semestreSel = "#accordion > .collapse";

    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
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

    await page.goto(`${process.env.MI_UTEM_URL}/academicos/mi-bitacora-notas${ref}`, {
      waitUntil: "networkidle2",
    });

    try {
      await page.waitForSelector(semestreSel, {
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

    const asignatura = await page.evaluate((codigoAsignatura) => {
      const semestreSel = "#accordion > .div-card-notas";
      const tablaNotasSel = "#accordion > .collapse";

      const semestres = Array.from(document?.querySelectorAll(semestreSel));
      const tablasNotas = Array.from(document?.querySelectorAll(tablaNotasSel));

      let coincidencia;

      for (let i = 0; i < semestres.length; i++) {
        const semestre = semestres[i];
        const tablaNotas = tablasNotas[i];

        const filasHeadSel = "div > div > div > table > thead > tr";
        const filasHead = Array.from(tablaNotas?.querySelectorAll(filasHeadSel));

        const filasBodySel = "div > div > div > table > tbody > tr";
        const filasBody = Array.from(tablaNotas?.querySelectorAll(filasBodySel));

        for (const fila of filasBody) {
          const columnas = Array.from(fila?.querySelectorAll("td"));
          const codigo = columnas[1]?.textContent.split(" ")[0]?.trim();

          if (codigo?.toUpperCase() == codigoAsignatura?.toUpperCase()) {
            const columnas = Array.from(fila?.querySelectorAll("td"));
            const codigo = columnas[1]?.textContent.split(" ")[0]?.trim();

            const nombre = columnas[1]?.textContent
              .split(" ")
              .slice(1)
              .join(" ")
              ?.trim();
            const tipoHora = columnas[2]?.textContent;

            let estado;
            let notaExamen;
            let notaPresentacion;
            let notaFinal;
            let evaluaciones = [];

            if (filasBody.length >= filasHead.length) {
              const notaFinalInputEl = columnas[
                columnas.length - 1
              ].querySelector("input");

              notaFinal = notaFinalInputEl
                ? parseFloat(
                    notaFinalInputEl.getAttribute("value").replace(",", ".")
                  )
                : null;
              notaExamen = parseFloat(
                columnas[columnas.length - 3]?.textContent
                  ?.trim()
                  .replace(",", ".")
              );
              notaPresentacion = parseFloat(
                columnas[columnas.length - 2]?.textContent
                  ?.trim()
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
              evaluaciones = columnasEvaluaciones?.map(
                (columnaEvaluacion, i) => {
                  const porcentajeSel = ".z > b";
                  const notaSel = ".z > .x > .y";

                  const porcentaje = parseInt(
                    columnaEvaluacion
                      .querySelector(porcentajeSel)
                      ?.textContent?.trim()
                      .replace("%", "")
                  );
                  const nota = parseFloat(
                    columnaEvaluacion.querySelector(notaSel)?.textContent?.trim()
                  );

                  if (nota || porcentaje) {
                    return { porcentaje, nota };
                  } else {
                    return null;
                  }
                }
              );
              evaluaciones = evaluaciones.filter((n) => n != null);
            }

            coincidencia = {
              codigo,
              nombre,
              tipoHora,
              estado,
              evaluaciones,
              notaExamen,
              notaPresentacion,
              notaFinal,
            };
          }
        }
      }
      return coincidencia;
    }, req.params.codigoAsignatura);

    if (asignatura) {
      res.status(200).send(asignatura);
    } else {
      next(MiUtemError.ASIGNATURA_NO_ENCONTRADA);
    }
  } catch (error) {
    next(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
};

module.exports = {
  obtenerAsignaturas,
  obtenerDetalleAsignatura,
  obtenerNotasPorCodigo,
};
