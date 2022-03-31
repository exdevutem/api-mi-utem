import SeccionAsignatura from "./seccion-asignatura.model";

export default interface Horario {
  asignaturas?: SeccionAsignatura[];
  horario: {
    asignatura: SeccionAsignatura;
    sala?: string;
    descripcionSala?: string;
  }[][];
  dias?: string[];
  periodos?: any[];
}
