import { useCallback, useEffect, useRef, useState } from "react";
import { CASE_PEOPLE } from "./caso-odin-data";
import {
  loadCaseFromDb,
  saveCaseToDb,
  updateCaseStyleInDbFn,
  syncChargesFn,
} from "./caso-odin-db.functions";

export interface Proof {
  id: string;
  label: string;
  url: string;
}

export type FieldType = "text" | "proofs" | "tasks";

export interface CaseField {
  id: string;
  label: string;
  type: FieldType;
  text: string;
  items: Proof[];
}

export interface StoredCharge {
  id: string;
  n: string;
  year: string;
  title: string;
  fields: CaseField[];
}

export interface StoredPerson {
  id: string;
  name: string;
  role: string;
  cedula?: string | undefined;
  telefono?: string | undefined;
  direccion?: string | undefined;
  email?: string | undefined;
  caso_id?: string | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
  photo: string;
  photoW: number;
  photoRatio: number;
  charges: StoredCharge[];
}

export interface CaseState {
  version: number;
  id: string;
  kicker: string;
  title: string;
  charge: string;
  tipoPenal?: string | undefined;
  estilo: "penal" | "civil" | "familiar";
  fechaCreacion?: string | undefined;
  people: StoredPerson[];
}

const STORAGE_PREFIX = "caso-state-";
const VERSION = 3;

export const DEFAULT_TIPO =
  "Lavado de activos — Art. 317 IN. 1 INC. 1. Activos de origen ilícito.";

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function textField(label: string, text = ""): CaseField {
  return { id: uid("f"), label, type: "text", text, items: [] };
}

export function listField(label: string, type: "proofs" | "tasks", items: Proof[] = []): CaseField {
  return { id: uid("f"), label, type, text: "", items };
}

export function buildInitialState(
  caseId = "caso-odin",
  name = "caso Odin",
  tipoPenal = "Penal",
  estilo: "penal" | "civil" | "familiar" = "penal"
): CaseState {
  return {
    version: VERSION,
    id: caseId,
    kicker: caseId === "caso-odin" ? "Expediente Reservado · Caso Odín" : `Expediente Judicial · ${name}`,
    title: name,
    charge:
      tipoPenal === "Penal"
        ? "Lavado de activos (Art. 317 IN. 1 INC. 1) — activos de origen ilícito."
        : `Materia / Delito: ${tipoPenal}`,
    tipoPenal,
    estilo,
    fechaCreacion: new Date().toISOString().split("T")[0] ?? "",
    people: CASE_PEOPLE.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      cedula: "",
      telefono: "",
      direccion: "",
      email: "",
      caso_id: caseId,
      x: p.x,
      y: p.y,
      w: 240,
      h: 190,
      photo: "",
      photoW: 200,
      photoRatio: 0.75,
      charges: p.charges.map((c) => ({
        id: c.id,
        n: c.n,
        year: c.year,
        title: c.title,
        fields: [
          textField("La justificación", c.just),
          listField(
            "La prueba (fojas)",
            "proofs",
            c.proofs.map((label) => ({ id: uid("pr"), label, url: "" })),
          ),
          listField(
            "Gestiones por realizar",
            "tasks",
            c.tasks.map((label) => ({ id: uid("tk"), label, url: "" })),
          ),
          textField("Tipo penal", DEFAULT_TIPO),
        ],
      })),
    })),
  };
}

export function chargeNumber(index: number) {
  return `Acusación ${String(index + 1).padStart(2, "0")}`;
}

export function renumberCharges(charges: StoredCharge[]): StoredCharge[] {
  return charges.map((c, i) => ({ ...c, n: chargeNumber(i) }));
}

export function emptyCharge(index: number): StoredCharge {
  return {
    id: uid("c"),
    n: chargeNumber(index - 1),
    year: "S/F",
    title: "Nueva acusación",
    fields: [
      textField("La justificación"),
      listField("La prueba (fojas)", "proofs"),
      listField("Gestiones por realizar", "tasks"),
      textField("Tipo penal", DEFAULT_TIPO),
    ],
  };
}

export function emptyPerson(index: number): StoredPerson {
  return {
    id: uid("p"),
    name: "Nuevo Implicado",
    role: `ACUSADO ${String(index).padStart(2, "0")}`,
    cedula: "",
    telefono: "",
    direccion: "",
    email: "",
    x: 50,
    y: 50,
    w: 240,
    h: 190,
    photo: "",
    photoW: 200,
    photoRatio: 0.75,
    charges: [emptyCharge(1)],
  };
}

export function migrate(raw: unknown, caseId = "caso-odin"): CaseState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<CaseState> & { people?: unknown };
  if (!parsed || !Array.isArray(parsed.people)) return null;
  const base = buildInitialState(caseId);

  const people = (parsed.people as unknown as Record<string, unknown>[]).map((p) => {
    const charges = Array.isArray(p["charges"] as unknown[]) ? (p["charges"] as Record<string, unknown>[]) : [];
    return {
      id: String(p["id"] ?? uid("p")),
      name: String(p["name"] ?? "Sin nombre"),
      role: String(p["role"] ?? ""),
      cedula: String(p["cedula"] ?? ""),
      telefono: String(p["telefono"] ?? ""),
      direccion: String(p["direccion"] ?? ""),
      email: String(p["email"] ?? ""),
      caso_id: String(p["caso_id"] ?? caseId),
      x: Number(p["x"] ?? 50),
      y: Number(p["y"] ?? 50),
      w: Number(p["w"] ?? 240),
      h: Number(p["h"] ?? 190),
      photo: String(p["photo"] ?? ""),
      photoW: Number(p["photoW"] ?? 200),
      photoRatio: Number(p["photoRatio"] ?? 0.75) || 0.75,
      charges: charges.map((c, i) => {
        const existing = c["fields"];
        const fields: CaseField[] = Array.isArray(existing)
          ? (existing as Record<string, unknown>[]).map((f) => ({
              id: String(f["id"] ?? uid("f")),
              label: String(f["label"] ?? "Campo"),
              type: (f["type"] === "proofs" || f["type"] === "tasks" ? f["type"] : "text") as FieldType,
              text: String(f["text"] ?? ""),
              items: Array.isArray(f["items"])
                ? (f["items"] as Record<string, unknown>[]).map((it) => ({
                    id: String(it["id"] ?? uid("it")),
                    label: String(it["label"] ?? ""),
                    url: String(it["url"] ?? ""),
                  }))
                : [],
            }))
          : [
              textField("La justificación", String(c["just"] ?? "")),
              listField(
                "La prueba (fojas)",
                "proofs",
                (Array.isArray(c["proofs"]) ? (c["proofs"] as Record<string, unknown>[]) : []).map((pr) => ({
                  id: String(pr["id"] ?? uid("pr")),
                  label: String(pr["label"] ?? ""),
                  url: String(pr["url"] ?? ""),
                })),
              ),
              listField(
                "Gestiones por realizar",
                "tasks",
                (Array.isArray(c["tasks"]) ? (c["tasks"] as Record<string, unknown>[]) : []).map((tk) => ({
                  id: String(tk["id"] ?? uid("tk")),
                  label: String(tk["label"] ?? ""),
                  url: "",
                })),
              ),
              textField("Tipo penal", String(c["tipo"] ?? DEFAULT_TIPO)),
            ];
        return {
          id: String(c["id"] ?? uid("c")),
          n: String(c["n"] ?? `Acusación ${i + 1}`),
          year: String(c["year"] ?? "S/F"),
          title: String(c["title"] ?? "Nueva acusación"),
          fields,
        };
      }),
    } satisfies StoredPerson;
  });

  return {
    version: VERSION,
    id: String(parsed.id ?? caseId),
    kicker: String(parsed.kicker ?? base.kicker),
    title: String(parsed.title ?? base.title),
    charge: String(parsed.charge ?? base.charge),
    tipoPenal: String(parsed.tipoPenal ?? base.tipoPenal ?? "Penal"),
    estilo: (["penal", "civil", "familiar"].includes(String(parsed.estilo))
      ? parsed.estilo
      : "penal") as "penal" | "civil" | "familiar",
    fechaCreacion: String(parsed.fechaCreacion ?? base.fechaCreacion),
    people,
  };
}

export type RemoteStatus = "local" | "syncing" | "synced" | "error";

export function useCaseState(caseId: string = "caso-odin") {
  const [state, setState] = useState<CaseState>(() => buildInitialState(caseId));
  const [hydrated, setHydrated] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus>("local");
  const remoteEnabled = useRef(false);
  const storageKey = `${STORAGE_PREFIX}${caseId}`;

  useEffect(() => {
    let cancelled = false;

    const localState = (() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        return raw ? migrate(JSON.parse(raw), caseId) : null;
      } catch {
        return null;
      }
    })();

    (async () => {
      try {
        const remote = await loadCaseFromDb({ data: { caseId } });
        if (cancelled) return;
        remoteEnabled.current = remote.configured;
        if (remote.configured) {
          setRemoteStatus("synced");
          const parsed = remote.payload ? migrate(JSON.parse(remote.payload), caseId) : null;
          if (parsed) {
            setState(parsed);
            setHydrated(true);
            return;
          }
        }
      } catch (err) {
        if (!cancelled) setRemoteStatus(remoteEnabled.current ? "error" : "local");
      }
      if (cancelled) return;
      if (localState) setState(localState);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId, storageKey]);

  const update = useCallback(
    (updater: (prev: CaseState) => CaseState) => {
      setState((prev) => {
        const next = updater(prev);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          window.alert(
            "No se pudo guardar el cambio (almacenamiento lleno). La información anterior se conserva; libere espacio o use imágenes más pequeñas.",
          );
          return prev;
        }
        return next;
      });
    },
    [storageKey],
  );

  const reset = useCallback(() => {
    const fresh = buildInitialState(caseId);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {}
    setState(fresh);
  }, [caseId, storageKey]);

  const setEstilo = useCallback(
    async (newEstilo: "penal" | "civil" | "familiar") => {
      update((prev) => ({ ...prev, estilo: newEstilo }));
      try {
        await updateCaseStyleInDbFn({ data: { caseId, estilo: newEstilo } });
      } catch (err) {
        console.error("Error setting style:", err);
      }
    },
    [caseId, update],
  );

  const updatePerson = useCallback(
    (personId: string, patch: Partial<StoredPerson>) =>
      update((prev) => ({
        ...prev,
        people: prev.people.map((p) => (p.id === personId ? { ...p, ...patch } : p)),
      })),
    [update],
  );

  const updateCharge = useCallback(
    (personId: string, chargeId: string, patch: Partial<StoredCharge>) =>
      update((prev) => ({
        ...prev,
        people: prev.people.map((p) =>
          p.id === personId
            ? {
                ...p,
                charges: p.charges.map((c) => (c.id === chargeId ? { ...c, ...patch } : c)),
              }
            : p,
        ),
      })),
    [update],
  );

  const addCharge = useCallback(
    (personId: string) => {
      let createdId = "";
      update((prev) => ({
        ...prev,
        people: prev.people.map((p) => {
          if (p.id !== personId) return p;
          const created = emptyCharge(p.charges.length + 1);
          createdId = created.id;
          return { ...p, charges: [...p.charges, created] };
        }),
      }));
      return createdId;
    },
    [update],
  );

  const removeCharge = useCallback(
    (personId: string, chargeId: string) =>
      update((prev) => ({
        ...prev,
        people: prev.people.map((p) =>
          p.id === personId
            ? { ...p, charges: renumberCharges(p.charges.filter((c) => c.id !== chargeId)) }
            : p,
        ),
      })),
    [update],
  );

  const moveCharge = useCallback(
    (personId: string, fromId: string, toId: string) => {
      if (fromId === toId) return;
      update((prev) => ({
        ...prev,
        people: prev.people.map((p) => {
          if (p.id !== personId) return p;
          const list = [...p.charges];
          const from = list.findIndex((c) => c.id === fromId);
          const to = list.findIndex((c) => c.id === toId);
          if (from < 0 || to < 0) return p;
          const [moved] = list.splice(from, 1);
          if (moved) list.splice(to, 0, moved);
          return { ...p, charges: renumberCharges(list) };
        }),
      }));
    },
    [update],
  );

  const addPerson = useCallback(() => {
    let createdId = "";
    update((prev) => {
      const created = emptyPerson(prev.people.length + 1);
      createdId = created.id;
      return { ...prev, people: [...prev.people, created] };
    });
    return createdId;
  }, [update]);

  const importPersonToBoard = useCallback(
    (sourcePerson: StoredPerson, includeDetails = true) => {
      const newPersonId = uid("p");
      const clonedCharges = includeDetails
        ? sourcePerson.charges.map((c) => ({
            ...c,
            id: uid("c"),
            fields: c.fields.map((f) => ({
              ...f,
              id: uid("f"),
              items: f.items.map((it) => ({ ...it, id: uid("it") })),
            })),
          }))
        : [emptyCharge(1)];

      const imported: StoredPerson = {
        ...sourcePerson,
        id: newPersonId,
        caso_id: caseId,
        charges: clonedCharges,
        x: Math.round(20 + Math.random() * 50),
        y: Math.round(25 + Math.random() * 40),
      };

      update((prev) => ({
        ...prev,
        people: [...prev.people, imported],
      }));
      return newPersonId;
    },
    [caseId, update],
  );

  const syncChargesToPerson = useCallback(
    async (targetPersonId: string, chargesToSync: StoredCharge[]) => {
      if (!chargesToSync || chargesToSync.length === 0) return 0;

      let addedCount = 0;
      update((prev) => ({
        ...prev,
        people: prev.people.map((p) => {
          if (p.id !== targetPersonId) return p;
          const existingTitles = new Set(p.charges.map((c) => c.title.trim().toLowerCase()));

          const newChargesToAdd: StoredCharge[] = [];
          for (const c of chargesToSync) {
            if (!existingTitles.has(c.title.trim().toLowerCase())) {
              newChargesToAdd.push({
                ...c,
                id: uid("c"),
                n: chargeNumber(p.charges.length + newChargesToAdd.length),
                fields: c.fields.map((f) => ({
                  ...f,
                  id: uid("f"),
                  items: f.items.map((it) => ({ ...it, id: uid("it") })),
                })),
              });
              addedCount++;
            }
          }

          return {
            ...p,
            charges: [...p.charges, ...newChargesToAdd],
          };
        }),
      }));

      // También intentamos sincronizar en BD
      try {
        await syncChargesFn({
          data: {
            targetPersonId,
            chargesToSync,
          },
        });
      } catch (err) {
        console.error("Error syncing charges to DB:", err);
      }

      return addedCount;
    },
    [update],
  );

  const removePerson = useCallback(
    (personId: string) =>
      update((prev) => ({ ...prev, people: prev.people.filter((p) => p.id !== personId) })),
    [update],
  );

  const saveBoard = useCallback(async () => {
    setRemoteStatus("syncing");
    try {
      const payload = JSON.stringify(state);
      const res = await saveCaseToDb({ data: { caseId, payload } });
      if (res?.configured && res.saved) {
        setRemoteStatus("synced");
        return true;
      } else {
        setRemoteStatus("error");
        return false;
      }
    } catch {
      setRemoteStatus("error");
      return false;
    }
  }, [caseId, state]);

  return {
    state,
    hydrated,
    remoteStatus,
    storageKey,

    update,
    setEstilo,
    updatePerson,
    updateCharge,
    addCharge,
    removeCharge,
    moveCharge,
    addPerson,
    importPersonToBoard,
    syncChargesToPerson,
    removePerson,
    reset,
    saveBoard,
  };
}