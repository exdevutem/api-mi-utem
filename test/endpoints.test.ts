import {describe, expect} from '@jest/globals';
import request from 'supertest';
import {server} from '../src/app';

let api;

const correo = process.env.USER_EMAIL || "";
const contrasenia = process.env.USER_PASSWORD || "";

describe('POST /auth', () => {
  it('login successful with @utem.cl', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('token')
  }, 25000)

  it('login successful without @utem.cl', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo.replace("@utem.cl", ""),
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('token')
  }, 25000)

  it('wrong email', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: "a" + correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(403)
  })

  it('wrong password', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia + "a"
      })
    expect(res.statusCode).toEqual(403)
  })
});

describe('SIGA flow', () => {
  it('login successful', async () => {
    let res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)

    const token = res.body.token;

    res = await request(server.app)
      .get('/v1/carreras')
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toEqual(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0]).toHaveProperty('id')

    const carreraId = res.body[0].id;

    res = await request(server.app)
      .get(`/v1/carreras/${carreraId}/asignaturas`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toEqual(200)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0]).toHaveProperty('id')

    const aisgnaturaId = res.body[0].id;

    res = await request(server.app)
      .get(`/v1/carreras/${carreraId}/asignaturas/${aisgnaturaId}/notas`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('notasParciales')

    // Solo ver en (mayo a junio) o (septiembre a diciembre) ya que dentro de esas fechas es más probable tener notas.
    const currentMonth = new Date().getMonth();
    if ((currentMonth === 4 || currentMonth === 5) || (currentMonth >= 8 && currentMonth <= 11)) {
      expect(res.body['notasParciales'].length).toBeGreaterThan(0)
    }
  }, 60000)
});


afterAll(done => {
  server.close();
  done();
})
