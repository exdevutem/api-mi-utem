import {describe, expect} from '@jest/globals';
import request from 'supertest';
import {server} from '../src/app';
import dayjs from "dayjs";

const correo = process.env.USER_EMAIL || "";
const contrasenia = process.env.USER_PASSWORD || "";

describe('Prueba de Academia', () => {
  test('Solicitud de Beca de Alimentación (Día Especifico)', async () => {
    let res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)

    const token = res.body.token;

    // Obtiene el viernes de esta semana o la próxima si ya pasó el viernes
    const currentOrNextFriday = dayjs().day() > 5 ? dayjs().add(1, 'week').day(5) : dayjs().day(5);
    res = await request(server.app)
      .post('/v1/beca-alimentacion')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desde: currentOrNextFriday.format('YYYY-MM-DD'),
      })

    expect(res.statusCode).toEqual(200)

    // Solo ver en (abril a junio) o (septiembre a diciembre), ya que dentro de esas fechas es más probable tener la beca activa.
    const currentMonth = new Date().getMonth();
    if ((currentMonth === 3 || currentMonth === 5) || (currentMonth >= 8 && currentMonth <= 11)) {
      expect(res.body.length).toBeGreaterThan(0)
    }
  }, 60000)

  test('Solicitud de Beca de Alimentación (Toda la Semana)', async () => {

    let res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)

    const token = res.body.token;

    res = await request(server.app)
      .post('/v1/beca-alimentacion')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desde: dayjs().tz('America/Santiago').format('YYYY-MM-DD'),
        hasta: dayjs().tz('America/Santiago').add(6, 'day').format('YYYY-MM-DD'),
      })

    expect(res.statusCode).toEqual(200)

    // Solo ver en (abril a junio) o (septiembre a diciembre), ya que dentro de esas fechas es más probable tener la beca activa.
    const currentMonth = new Date().getMonth();
    if ((currentMonth === 3 || currentMonth === 5) || (currentMonth >= 8 && currentMonth <= 11)) {
      expect(res.body.length).toBeGreaterThan(0)
      // Esperar que contenga algun codigo que contenga la vigenca de la beca
      expect((res.body || []).find(it => dayjs(it.validoPara).tz('America/Santiago').isBetween(dayjs().tz('America/Santiago').format('YYYY-MM-DD'), dayjs().tz('America/Santiago').add(6, 'day').format('YYYY-MM-DD')))).toBeTruthy()
    }
  });

  test('Solicitud de Beca de Alimentación (Desde Fecha Pasada)', async () => {

    let res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)

    const token = res.body.token;

    res = await request(server.app)
      .post('/v1/beca-alimentacion')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desde: dayjs().tz('America/Santiago').subtract(1, 'day').format('YYYY-MM-DD'),
        hasta: dayjs().tz('America/Santiago').add(6, 'day').format('YYYY-MM-DD'),
      })

    expect(res.statusCode).toEqual(400)
  });

  test('Solicitud de Beca de Alimentación (Hasta Fecha Pasada a Desde)', async () => {

    let res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)

    const token = res.body.token;

    res = await request(server.app)
      .post('/v1/beca-alimentacion')
      .set('Authorization', `Bearer ${token}`)
      .send({
        desde: dayjs().tz('America/Santiago').format('YYYY-MM-DD'),
        hasta: dayjs().tz('America/Santiago').subtract(3, 'day').format('YYYY-MM-DD'),
      })

    expect(res.statusCode).toEqual(200) // Aunque la fecha de término sea antes de la fecha de inicio, se generará el codigo para hoy
  });
});

afterAll(done => {
  server.close();
  done();
})
