// Registro de escenarios tácticos y su relación con las plantas y salas del plano general.
import enfermeria from './escenarios/enfermeria.js';
import superficie from './escenarios/superficie.js';
import archivo from './escenarios/archivo.js';
import laboratorios from './escenarios/laboratorios.js';
import armeria from './escenarios/armeria.js';
import bombas from './escenarios/bombas.js';
import camara from './escenarios/camara.js';

export const SCENARIOS = [superficie, enfermeria, archivo, laboratorios, armeria, bombas, camara];
export const SCENARIO_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]));
/** Escenarios cuyo recinto incluye la sala indicada. */
export function scenariosForRoom(roomId) { return SCENARIOS.filter((s) => s.rooms.includes(roomId)); }
