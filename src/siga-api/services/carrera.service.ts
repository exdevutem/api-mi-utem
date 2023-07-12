import axios, {AxiosResponse} from "axios";
import qs from "qs";
import Carrera from "../../core/models/carrera.model";

export class SigaApiCarreraService {
    public static async getCarreras(token: string): Promise<Carrera[]> {
        const uri: string = "/estudiante/carreras/";
        const url: string = `${process.env.SIGA_API_URL}${uri}`;

        let res: AxiosResponse = await axios.post(url, qs.stringify({token}), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Host: "siga.utem.cl",
            },
        });

        let carreras: Carrera[] = [];

        if (res.data.response?.length) {
            for (const carreraJson of res.data.response) {
                carreras.push({
                    id: carreraJson.carrera_id,
                    codigo: carreraJson.codigo_carrera.toString(),
                    nombre: carreraJson.nombre_carrera,
                    estado: carreraJson.situacion_academica.trim(),
                    orden: carreraJson.orden,
                });
            }
        }

        return carreras;
    }
}
