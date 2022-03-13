import SeccionAsignatura from "./seccion-asignatura.model";

export default interface Horario {
  asignaturas?: SeccionAsignatura[];
  horario: {
    asignatura: SeccionAsignatura;
    sala?: string;
  }[][];
  dias?: string[];
  periodos?: any[];
}
