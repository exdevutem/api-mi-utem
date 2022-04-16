export default interface Permiso {
  id?: string;
  titulo?: string;
  descripcion?: string;
  solicitado?: boolean;
  usuario?: {
    rut?: string;
    nombreCompleto?: string;
  };
  perfil?: string;
  fechaSolicitud?: Date;
  jornada?: string;
  motivo?: string;
  vigencia?: string;
  codigoBarra?: string;
  codigoQr?: string;
  codigoValidacion?: string;
  campus?: string;
  dependencia?: string;
  pdfBase64?: string;
}
