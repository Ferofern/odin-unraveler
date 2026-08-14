import { createServerFn } from "@tanstack/react-start";

/** Identificador del expediente en la base de datos. */
export const CASE_ID = "caso-odin";

export interface RemoteLoadResult {
  configured: boolean;
  payload: string | null;
}

export interface RemoteSaveResult {
  configured: boolean;
  saved: boolean;
}

export const loadCaseFromDb = createServerFn({ method: "GET" }).handler(
  async (): Promise<RemoteLoadResult> => {
    const { readCase } = await import("./caso-odin-db.server");
    return readCase(CASE_ID);
  },
);

export const saveCaseToDb = createServerFn({ method: "POST" })
  .inputValidator((data: { payload: string }) => {
    if (!data || typeof data.payload !== "string") throw new Error("payload inválido");
    return data;
  })
  .handler(async ({ data }): Promise<RemoteSaveResult> => {
    const { writeCase } = await import("./caso-odin-db.server");
    return writeCase(CASE_ID, data.payload);
  });
