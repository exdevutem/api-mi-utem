import {describe, expect} from '@jest/globals';
import request from 'supertest';
import {server} from '../src/app';

const correo = process.env.USER_EMAIL || "";
const contrasenia = process.env.USER_PASSWORD || "";

describe('Prueba de Inicio de Sesión', () => {
  it('Inicio de Sesión con @utem.cl', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('token')
  }, 25000)

  it('Inicio de sesión sin @utem.cl', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo.replace("@utem.cl", ""),
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('token')
  }, 25000)

  it('Correo Incorrecto', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: "a" + correo,
        contrasenia: contrasenia
      })
    expect(res.statusCode).toEqual(403)
  })

  it('Contraseña Incorrecta', async () => {
    const res = await request(server.app)
      .post('/v1/auth')
      .send({
        correo: correo,
        contrasenia: contrasenia + "a"
      })
    expect(res.statusCode).toEqual(403)
  })
});


afterAll(done => {
  server.close();
  done();
})
