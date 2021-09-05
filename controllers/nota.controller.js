require('dotenv').config()

const puppeteer = require('puppeteer');
const MiUtemError = require('../utils/errors');

const ref = process.env.REQ_REF ? `?ref=${process.env.REQ_REF}` : '';

const obtenerNotas = async (req, res, next) => {
    let browser = null;
    try {
        const semestreSel = "#accordion > .collapse";

        browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"], });
        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font', 'script', 'other', 'xhr'].includes(request.resourceType())) {
                request.abort();
            } else {
                request.continue();
            }
        });

        // @ts-ignore
        await page.setCookie(...req.cookies);

        await page.goto(`${process.env.MI_UTEM_URL}/academicos/mi-bitacora-notas${ref}`, {waitUntil: 'networkidle2'});

        try {
            await page.waitForSelector(semestreSel, {
                timeout: 5000
            });
        } catch (error) {
            const url = await page.url();
            if (url.startsWith(`${process.env.MI_UTEM_URL}`)) {
                next(error);
            } else {
                next(MiUtemError.SESION_EXPIRADA);
            }
            
        }
        
        const semestres = await page.evaluate(() => {
            const semestreSel = "#accordion > .div-card-notas"
            const tablaNotasSel = "#accordion > .collapse";
            

            const tablasNotas = Array.from(document.querySelectorAll(tablaNotasSel));

            const semestres = tablasNotas.map((tablaNotas, i) => {
                const filasHeadSel = "div > div > div > table > thead > tr";
                const filasHead = Array.from(tablaNotas.querySelectorAll(filasHeadSel));

                const filasBodySel = "div > div > div > table > tbody > tr";
                const filasBody = Array.from(tablaNotas.querySelectorAll(filasBodySel));

                let notas = filasBody.map(fila => {
                    const columnas = Array.from(fila.querySelectorAll('td'));
                    const codigo = columnas[1]?.textContent.split(" ")[0].trim();

                    const nombre = columnas[1]?.textContent.split(" ").slice(1).join(" ").trim();
                    const tipoHora = columnas[2]?.textContent;

                    let estado;
                    let notaExamen;
                    let notaPresentacion;
                    let notaFinal;
                    let evaluaciones = [];

                    if (filasBody.length >= filasHead.length) {
                        const notaFinalInputEl = columnas[columnas.length - 1].querySelector("input");
                        
                        notaFinal = notaFinalInputEl ? parseFloat(notaFinalInputEl.getAttribute("value").replace(",", ".")) : null;
                        notaExamen = parseFloat(columnas[columnas.length - 3]?.textContent.trim().replace(",", "."));
                        notaPresentacion = parseFloat(columnas[columnas.length - 2]?.textContent.trim().replace(",", "."));
                        
                        if (notaFinalInputEl && notaFinalInputEl.classList.contains("input_success")) {
                            estado = "Aprobado";
                        } else if (notaFinalInputEl && notaFinalInputEl.classList.contains("input_danger")) {
                            estado = "Reprobado";
                        } else {
                            estado = "Inscrito";
                        }
                        
                        const columnasEvaluaciones = columnas.slice(3, -3);
                        evaluaciones = columnasEvaluaciones.map((columnaEvaluacion, i) => {
                            const porcentajeSel = ".z > b";
                            const notaSel = ".z > .x > .y";

                            const porcentaje = parseInt(columnaEvaluacion.querySelector(porcentajeSel)?.textContent.trim().replace("%", ""));
                            const nota = parseFloat(columnaEvaluacion.querySelector(notaSel)?.textContent.trim());
                            
                            if (nota || porcentaje) {
                                if (true) {
                                    return { porcentaje, nota };
                                } else {
                                    return {
                                        porcentaje,
                                        nota: null
                                    }
                                }
                                
                            } else {
                                return null;
                            }
                        });
                        evaluaciones = evaluaciones.filter(n => n != null);
                    }

                    return {
                        codigo,
                        nombre,
                        tipoHora,
                        estado,
                        evaluaciones,
                        notaExamen,
                        notaPresentacion,
                        notaFinal
                    }
                });
                return {
                    semestre: Array.from(document.querySelectorAll(semestreSel))[i]?.textContent.trim(),
                    notas
                };
            });

            return semestres;
            
        });

        if (req.query.semestre && req.query.semestre == "false") {
            let soloNotas = []
            semestres.map(s => {
                soloNotas = [...soloNotas, ...s.notas];
            });
            res.status(200).send(soloNotas);
            
        } else {
            res.status(200).send(semestres);
        }


        
    } catch (error) {
        
        next(error);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}

module.exports = { obtenerNotas };