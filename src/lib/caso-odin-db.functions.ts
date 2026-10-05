import { createServerFn } from "@tanstack/react-start";
import type { CaseSummary } from "./caso-odin-db.server";

export const CASE_ID = "caso-odin";

export interface RemoteLoadResult {
  configured: boolean;
  payload: string | null;
  caseInfo?: CaseSummary | null;
}

export interface RemoteSaveResult {
  configured: boolean;
  saved: boolean;
}

export const loadCasesList = createServerFn({ method: "GET" }).handler(
  async () => {
    const { listCases } = await import("./caso-odin-db.server");
    return listCases();
  },
);

export const loadCaseFromDb = createServerFn({ method: "GET" })
  .validator((data?: { caseId?: string }) => data)
  .handler(async (ctx: any): Promise<RemoteLoadResult> => {
    const { readCase } = await import("./caso-odin-db.server");
    const caseId = ctx?.data?.caseId || CASE_ID;
    return readCase(caseId);
  });

export const saveCaseToDb = createServerFn({ method: "POST" })
  .inputValidator((data: { caseId?: string; payload: string }) => {
    if (!data || typeof data.payload !== "string") throw new Error("payload inválido");
    return { caseId: data.caseId || CASE_ID, payload: data.payload };
  })
  .handler(async ({ data }): Promise<RemoteSaveResult> => {
    const { writeCase } = await import("./caso-odin-db.server");
    return writeCase(data.caseId, data.payload);
  });

export const createCaseInDbFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      nombre: string;
      tipo_penal: string;
      fecha_creacion?: string | undefined;
      estilo: "penal" | "civil" | "familiar";
      importPeople?: { personId: string; includeDetails: boolean }[] | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { createCaseInDb } = await import("./caso-odin-db.server");
    return createCaseInDb(data);
  });

export const deleteCaseFromDbFn = createServerFn({ method: "POST" })
  .inputValidator((data: { caseId: string }) => data)
  .handler(async ({ data }) => {
    const { deleteCaseFromDb } = await import("./caso-odin-db.server");
    return deleteCaseFromDb(data.caseId);
  });

export const updateCaseStyleInDbFn = createServerFn({ method: "POST" })
  .inputValidator((data: { caseId: string; estilo: "penal" | "civil" | "familiar" }) => data)
  .handler(async ({ data }) => {
    const { updateCaseStyleInDb } = await import("./caso-odin-db.server");
    return updateCaseStyleInDb(data.caseId, data.estilo);
  });

export const loadAllImplicadosGlobalFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { listAllImplicadosGlobal } = await import("./caso-odin-db.server");
    return listAllImplicadosGlobal();
  },
);

export const addGlobalImplicadoFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      nombre: string;
      cedula?: string | undefined;
      telefono?: string | undefined;
      direccion?: string | undefined;
      email?: string | undefined;
      rol?: string | undefined;
      foto_url?: string | undefined;
      caso_id?: string | undefined;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { addGlobalImplicadoToDb } = await import("./caso-odin-db.server");
    return addGlobalImplicadoToDb(data);
  });

export const syncChargesFn = createServerFn({ method: "POST" })
  .inputValidator((data: { targetPersonId: string; chargesToSync: any[] }) => data)
  .handler(async ({ data }) => {
    const { syncChargesBetweenCases } = await import("./caso-odin-db.server");
    return syncChargesBetweenCases(data);
  });
