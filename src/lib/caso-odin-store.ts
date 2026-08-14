import { useCallback, useEffect, useRef, useState } from "react";
import { CASE_PEOPLE } from "./caso-odin-data";
import { loadCaseFromDb, saveCaseToDb } from "./caso-odin-db.functions";


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
  /** Used when type === "text" */
  text: string;
  /** Used when type === "proofs" or "tasks" */
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
  x: number;
  y: number;
  w: number;
  h: number;
  photo: string;
  /** Rendered photo width in px (height derives from the ratio). */
  photoW: number;
  /** height / width of the loaded image. */
  photoRatio: number;
  charges: StoredCharge[];
}

export interface CaseState {
  version: number;
  kicker: string;
  title: string;
  charge: string;
  people: StoredPerson[];
}

const STORAGE_KEY = "caso-odin-state-v2";
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

export function buildInitialState(): CaseState {
  return {
    version: VERSION,
    kicker: "Expediente Reservado · Caso Odín",
    title: "Mapa de Implicados y Acusaciones",
    charge: "Lavado de activos (Art. 317 IN. 1 INC. 1) — activos de origen ilícito.",
    people: CASE_PEOPLE.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
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

/** Renumbers charges according to their current order. */
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
    name: `Nuevo implicado ${index}`,
    role: `Implicada ${String(index).padStart(2, "0")}`,
    x: 50,
    y: 50,
    w: 240,
    h: 190,
    photo: "",
    photoW: 200,
    photoRatio: 0.75,
    charges: [],
  };
}


/** Migrates any previously stored shape (v2 and earlier) into the v3 model without data loss. */
function migrate(raw: unknown): CaseState | null {
  const parsed = raw as Partial<CaseState> & { people?: unknown };
  if (!parsed || !Array.isArray(parsed.people)) return null;
  const base = buildInitialState();

  const people = (parsed.people as unknown as Record<string, unknown>[]).map((p) => {
    const charges = Array.isArray(p['charges'] as unknown[]) ? (p['charges'] as Record<string, unknown>[]) : [];
    return {
      id: String(p['id'] ?? uid("p")),
      name: String(p['name'] ?? "Sin nombre"),
      role: String(p['role'] ?? ""),
      x: Number(p['x'] ?? 50),
      y: Number(p['y'] ?? 50),
      w: Number(p['w'] ?? 240),
      h: Number(p['h'] ?? 190),
      photo: String(p['photo'] ?? ""),
      photoW: Number(p['photoW'] ?? 200),
      photoRatio: Number(p['photoRatio'] ?? 0.75) || 0.75,
      charges: charges.map((c, i) => {
        const existing = c['fields'];
        const fields: CaseField[] = Array.isArray(existing)
          ? (existing as Record<string, unknown>[]).map((f) => ({
              id: String(f['id'] ?? uid("f")),
              label: String(f['label'] ?? "Campo"),
              type: (f['type'] === "proofs" || f['type'] === "tasks" ? f['type'] : "text") as FieldType,
              text: String(f['text'] ?? ""),
              items: Array.isArray(f['items'])
                ? (f['items'] as Record<string, unknown>[]).map((it) => ({
                    id: String(it['id'] ?? uid("it")),
                    label: String(it['label'] ?? ""),
                    url: String(it['url'] ?? ""),
                  }))
                : [],
            }))
          : [
              textField("La justificación", String(c['just'] ?? "")),
              listField(
                "La prueba (fojas)",
                "proofs",
                (Array.isArray(c['proofs']) ? (c['proofs'] as Record<string, unknown>[]) : []).map((pr) => ({
                  id: String(pr['id'] ?? uid("pr")),
                  label: String(pr['label'] ?? ""),
                  url: String(pr['url'] ?? ""),
                })),
              ),
              listField(
                "Gestiones por realizar",
                "tasks",
                (Array.isArray(c['tasks']) ? (c['tasks'] as Record<string, unknown>[]) : []).map((tk) => ({
                  id: String(tk['id'] ?? uid("tk")),
                  label: String(tk['label'] ?? ""),
                  url: "",
                })),
              ),
              textField("Tipo penal", String(c['tipo'] ?? DEFAULT_TIPO)),
            ];
        return {
          id: String(c['id'] ?? uid("c")),
          n: String(c['n'] ?? `Acusación ${i + 1}`),
          year: String(c['year'] ?? "S/F"),
          title: String(c['title'] ?? "Nueva acusación"),
          fields,
        };
      }),
    } satisfies StoredPerson;
  });

  return {
    version: VERSION,
    kicker: String(parsed.kicker ?? base.kicker),
    title: String(parsed.title ?? base.title),
    charge: String(parsed.charge ?? base.charge),
    people,
  };
}

export type RemoteStatus = "local" | "syncing" | "synced" | "error";

export function useCaseState() {
  const [state, setState] = useState<CaseState>(() => buildInitialState());
  const [hydrated, setHydrated] = useState(false);
  /** "local" = sin BD configurada (solo navegador). */
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus>("local");
  const remoteEnabled = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const localState = (() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? migrate(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    })();

    (async () => {
      try {
        const remote = await loadCaseFromDb();
        if (cancelled) return;
        remoteEnabled.current = remote.configured;
        if (remote.configured) {
          setRemoteStatus("synced");
          const parsed = remote.payload ? migrate(JSON.parse(remote.payload)) : null;
          if (parsed) {
            setState(parsed);
            setHydrated(true);
            return;
          }
        }
      } catch {
        if (!cancelled) setRemoteStatus(remoteEnabled.current ? "error" : "local");
      }
      if (cancelled) return;
      if (localState) setState(localState);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Envía el expediente a la base de datos (con retardo para agrupar cambios). */
  const scheduleRemoteSave = useCallback((next: CaseState) => {
    if (!remoteEnabled.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setRemoteStatus("syncing");
      saveCaseToDb({ data: { payload: JSON.stringify(next) } })
        .then((res) => setRemoteStatus(res.configured ? "synced" : "local"))
        .catch(() => setRemoteStatus("error"));
    }, 800);
  }, []);

  const update = useCallback(
    (updater: (prev: CaseState) => CaseState) => {
      setState((prev) => {
        const next = updater(prev);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          window.alert(
            "No se pudo guardar el cambio (almacenamiento lleno). La información anterior se conserva; libere espacio o use imágenes más pequeñas.",
          );
          return prev;
        }
        scheduleRemoteSave(next);
        return next;
      });
    },
    [scheduleRemoteSave],
  );


  const reset = useCallback(() => {
    const fresh = buildInitialState();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(fresh);
    scheduleRemoteSave(fresh);
  }, [scheduleRemoteSave]);


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

  /** Moves a charge before the target charge and renumbers the whole list. */
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

  const removePerson = useCallback(
    (personId: string) =>
      update((prev) => ({ ...prev, people: prev.people.filter((p) => p.id !== personId) })),
    [update],
  );

  return {
    state,
    hydrated,
    remoteStatus,

    update,
    updatePerson,
    updateCharge,
    addCharge,
    removeCharge,
    moveCharge,
    addPerson,
    removePerson,
    reset,
  };
}

