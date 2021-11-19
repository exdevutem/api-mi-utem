const chai = require("chai");
const chaiHttp = require("chai-http")
const nock = require("nock");
const expect = chai.expect;
const usuario = require("../../controllers/usuario.controller");

chai.use(chaiHttp);

const MockSiseiApi = nock(`${process.env.SISEI_API}`)

describe("Test validate email: ", () => {
    const emails = [
        "test@utem.cl",
        "test_2@gmail.com",
        "test_3@live.cl",
        "test_4@fakemail.net"
    ]
    it("Validando emails", () => {   
        emails.forEach((email) => {
            result = usuario.validarCorreo(email)
            chai.assert.equal(result, true)
        })
    })
});

describe("Test validate email: invalid emails", () => {
    const not_valid_emails = [
        "hola12345.qwe012",
        "juan.avendanon",
        "jorge.verdugoc",
        "@asdas.123"
    ]
    it("Validando emails no válidos", () => {
        not_valid_emails.forEach((email) => {
            result = usuario.validarCorreo(email)
            chai.assert.equal(result, false)
        })
    })
});

describe("Test get token api sisei", () => {
    const mock_correo = "test@utem.cl"
    const mock_contrasenia = "test123"
    const mock_response = {
        "status_code": 200,
        "response": {
            "token": "test_token",
            "datos_persona": {
                "rut": 12345678-9,
                "nombre_completo": "Test user",
                "correo_personal": "test@nicetest.com",
                "correo_utem": mock_correo,
                "foto": "https://testimage.cl"
            },
            "perfiles": "Test user"
        }
    }
    MockSiseiApi.post("/servicios/autenticacion/login/")
    .reply(200, mock_response)

    it("Mock test para token api sisei", async () => {
        await usuario.tokenMiUtemDesdeApiSisei(mock_correo, mock_contrasenia)
        .then((result) => {
            expect(result.status).to.equal(200)
            expect(result.data).to.deep.equal(mock_response)
        })
    })
});
