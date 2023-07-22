import Evaluacion from "./evaluacion.model";
import Usuario from "./usuario.model";

// Este modelo actuará como una combinación entre una asignatura y una sección.

export default interface SeccionAsignatura {
  id?: string; // seccionId
  codigo?: string;
  nombre?: string;
  docente?: string;
  tipoHora?: string;
  seccion?: string;
  intentos?: number;
  estado?: string;
  notasParciales?: Evaluacion[];
  estudiantes?: Usuario[];
  horario?: string;
  asistenciaAlDia?: number;
  asistencia?: {
    total?: number;
    asistida?: number;
    sinRegistro?: number;
  };
  sala?: string;
  tipoAsignatura?: string;
  notaExamen?: number;
  notaPresentacion?: number;
  notaFinal?: number;
  notaEstimada?: number;
}
