const chai = require("chai");
const usuario = require("../../controllers/usuario.controller")


describe("Test validate email: ", () => {
    it("Validando emails", () => {
        emails = [
            "test@utem.cl",
            "test_2@gmail.com",
            "test_3@live.cl",
            "test_4@fakemail.net"
        ]
        emails.forEach((email) => {
            result = usuario.validarCorreo(email)
            chai.assert.equal(result, true)
        })
    })
})

describe("Test validate email: invalid emails", () => {
    it("Validando emails no válidos", () =>{
        not_valid_emails = [
            "hola12345.qwe012",
            "juan.avendanon",
            "jorge.verdugoc",
            "@asdas.123"
        ]
        emails.forEach((email) => {
            result = usuario.validarCorreo(email)
            chai.assert.equal(result, true)
        })
    })
})