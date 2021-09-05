class MiUtemError extends Error {
    static CREDENCIALES_INCORRECTAS = new MiUtemError(
        new Error("Usuario o contraseña incorrecta"),
        "Usuario o contraseña incorrecta",
        403,
        1
    );

    static NO_ESTUDIANTE = new MiUtemError(
        new Error("El usuario no es estudiante"),
        "Usuario o contraseña incorrecta",
        403,
        2
    );

    static SESION_EXPIRADA = new MiUtemError(
        new Error("Expiró la sesión"),
        "Debe iniciar sesión nuevamente",
        401,
        3
    );

    static SIN_ROL = new MiUtemError(
        new Error("El usuario no tiene rol"),
        "El usuario no tiene rol definido en la plataforma. Si es estudiante nuevo, debe esperar a que se habilite el contenido de la plataforma, si es estudiante antiguo debe enviar correo a soporte.sisei@utem.cl",
        403,
        4
    );

    static HORARIO_NO_ENCONTRADO = new MiUtemError(
        new Error("No se encontró ningún horario"),
        "No se encontró ningún horario",
        404,
        5
    );

    static ASIGNATURA_NO_ENCONTRADA = new MiUtemError(
        new Error("No se encontró ninguna asignatura"),
        "No se encontró ninguna asignatura",
        404,
        6
    );

    static FIRESTORE_USUARIO_RUT_NO_ENCONTRADO = new MiUtemError(
        new Error("No se encontró ningún usuario con ese RUT registrado"),
        "No se encontró ningún usuario con ese RUT registrado",
        404,
        7
    );

    static BAD_REQUEST = new MiUtemError(
        new Error("Faltan algunos parámetros para la consulta"),
        "Faltan algunos parámetros para la consulta",
        400,
        8
    );

    static SISEI_KEY_INVALIDA = new MiUtemError(
        new Error("La llave no coincide"),
        "La llave configurada en las variables de entorno no coincide",
        401,
        9
    );

    constructor(data, message, statusCode, internalCode) {
      super(data);
      this.data = data;
      this.message = message ? message : "Error inesperado";
      this.statusCode = statusCode ? statusCode : 500;
      this.internalCode = internalCode ? internalCode : 0;
    }


}

module.exports = MiUtemError;