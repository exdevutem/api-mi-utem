import SeccionAsignatura from "../../core/models/seccion-asignatura.model";

export default interface Semestre {
  id?: string;
  descripcion?: string;
  secciones?: SeccionAsignatura[];
}
