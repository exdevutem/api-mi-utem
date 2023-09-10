export default class GenericError extends Error {
  public message: string;
  public publicMessage: string;
  public statusCode: number;
  public internalCode: number;

  constructor(
    message: string,
    publicMessage?: string,
    statusCode?: number,
    internalCode?: number
  ) {
    super(message ?? "Fallo en el servidor");
    this.message = message ?? "Fallo en el servidor";
    this.publicMessage = publicMessage ?? "Error inesperado";
    this.statusCode = statusCode ?? 500;
    this.internalCode = internalCode ?? 0;
  }

  static CREDENCIALES_INCORRECTAS = new GenericError(
    "Usuario o contraseña incorrecta",
    "Usuario o contraseña incorrecta",
    403,
    1
  );

  static NO_ESTUDIANTE = new GenericError(
    "El usuario no es estudiante",
    "Usuario o contraseña incorrecta",
    403,
    2
  );

  static MI_UTEM_EXPIRO = new GenericError(
    "Expiró la sesión de Mi UTEM",
    "Debe iniciar sesión nuevamente",
    401,
    3
  );

  static ACADEMIA_EXPIRO = new GenericError(
    "Expiró la sesión de Academia UTEM",
    "Debe iniciar sesión nuevamente",
    401,
    3.1
  );

  static SIN_ROL = new GenericError(
    "El usuario no tiene rol",
    "El usuario no tiene rol definido en la plataforma. Si es estudiante nuevo, debe esperar a que se habilite el contenido de la plataforma, si es estudiante antiguo debe enviar correo a soporte.sisei@utem.cl",
    403,
    4
  );

  static HORARIO_NO_ENCONTRADO = new GenericError(
    "No se encontró ningún horario",
    "No se encontró ningún horario",
    404,
    5
  );

  static ASIGNATURA_NO_ENCONTRADA = new GenericError(
    "No se encontró ninguna asignatura",
    "No se encontró ninguna asignatura",
    404,
    6
  );

  static FIRESTORE_USUARIO_RUT_NO_ENCONTRADO = new GenericError(
    "No se encontró ningún usuario con ese RUT registrado",
    "No se encontró ningún usuario con ese RUT registrado",
    404,
    7
  );

  static BAD_REQUEST = new GenericError(
    "Faltan algunos parámetros para la consulta",
    "Faltan algunos parámetros para la consulta",
    400,
    8
  );

  static SISEI_KEY_INVALIDA = new GenericError(
    "La llave no coincide",
    "La llave configurada en las variables de entorno no coincide",
    401,
    9
  );

  static TOKEN_INVALIDA = new GenericError(
    "No está autenticado o la token es inválida",
    "Verifique su consulta e intente nuevamente",
    401,
    10
  );

  static CORREO_UTEM_INVALIDO = new GenericError(
    "El correo no tiene formato válido",
    "Verifique que el correo sea un correo @utem.cl válido",
    400,
    11
  );

  static SIGA_UTEM_EXPIRO = new GenericError(
    "Expiró la sesión de SIGA UTEM",
    "Debe iniciar sesión nuevamente",
    401,
    12
  );

  static SIGA_UTEM_ERROR = new GenericError(
    "Hay un error en la plataforma SIGA UTEM",
    "Por favor intente más tarde",
    503,
    13
  );

  static PERMISO_NO_ENCONTRADO = new GenericError(
    "El permiso no existe",
    "Verifique que el ID del permiso sea correcto",
    404,
    15
  );

  static SIN_BECA_ALIMENTACION = new GenericError(
    "El usuario no tiene beca de alimentación",
    "No tiene beca de alimentación",
    403,
    16
  );

  static SIN_CODIGO_BECA_ALIMENTACION = new GenericError(
    "El usuario no tiene código de beca de alimentación",
    "No se ha encontrado el código de beca de alimentación",
    404,
    17
  );

}
