/**
 * Capa de acceso a la base de datos del Caso Odín (server-only).
 *
 * TODO (usuario): colocar aquí la dirección y la contraseña de la base de datos.
 * Se leen desde variables de entorno del servidor para no exponer credenciales:
 *   CASE_DB_URL       → p. ej. postgresql://usuario:contraseña@host:5432/base
 *   CASE_DB_PASSWORD  → opcional, si la URL no la incluye
 *   CASE_DB_TABLE     → opcional, por defecto "caso_odin_state"
 *
 * Mientras no existan esas variables, las funciones devuelven `configured: false`
 * y la aplicación sigue trabajando con el almacenamiento local del navegador.
 */

export interface DbConfig {
  url: string;
  password: string;
  table: string;
}

export function readDbConfig(): DbConfig | null {
  const url = process.env['CASE_DB_URL'];
  if (!url) return null;
  return {
    url,
    password: process.env['CASE_DB_PASSWORD'] ?? "",
    table: process.env['CASE_DB_TABLE'] ?? "caso_odin_state",
  };
}

export interface DbReadResult {
  configured: boolean;
  /** Estado serializado (JSON) del expediente, o null si no hay fila guardada. */
  payload: string | null;
}

export interface DbWriteResult {
  configured: boolean;
  saved: boolean;
}

/**
 * Lee el expediente almacenado.
 *
 * TODO (usuario): reemplazar el bloque marcado por la consulta real, por ejemplo:
 *   const rows = await sql`select payload from ${sql(cfg.table)} where id = ${caseId}`
 */
export async function readCase(caseId: string): Promise<DbReadResult> {
  const cfg = readDbConfig();
  if (!cfg) return { configured: false, payload: null };

  // --- INICIO consulta real (pendiente de credenciales) ---
  void caseId;
  void cfg;
  return { configured: true, payload: null };
  // --- FIN consulta real ---
}

/**
 * Guarda (upsert) el expediente completo.
 *
 * TODO (usuario): reemplazar el bloque marcado por el upsert real, por ejemplo:
 *   await sql`insert into ${sql(cfg.table)} (id, payload, updated_at)
 *             values (${caseId}, ${payload}::jsonb, now())
 *             on conflict (id) do update set payload = excluded.payload, updated_at = now()`
 */
export async function writeCase(caseId: string, payload: string): Promise<DbWriteResult> {
  const cfg = readDbConfig();
  if (!cfg) return { configured: false, saved: false };

  // --- INICIO escritura real (pendiente de credenciales) ---
  void caseId;
  void payload;
  void cfg;
  return { configured: true, saved: false };
  // --- FIN escritura real ---
}
