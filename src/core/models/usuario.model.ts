export default interface Usuario {
  id?: string;
  username?: string;
  token?: string;
  rut?: number;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  correoPersonal?: string;
  correoUtem?: string;
  fotoBase64?: string;
  fotoUrl?: string;
  perfiles?: string[];
  fcmTokens?: string[];
}
