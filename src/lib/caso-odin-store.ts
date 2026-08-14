import { useCallback, useEffect, useState } from "react";
import { CASE_PEOPLE } from "./caso-odin-data";

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

export function emptyCharge(index: number): StoredCharge {
  return {
    id: uid("c"),
    n: `Acusación ${index}`,
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

export function useCaseState() {
  const [state, setState] = useState<CaseState>(() => buildInitialState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const migrated = migrate(JSON.parse(raw));
        if (migrated) setState(migrated);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: CaseState) => CaseState) => {
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
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = buildInitialState();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(fresh);
  }, []);

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
          p.id === personId ? { ...p, charges: p.charges.filter((c) => c.id !== chargeId) } : p,
        ),
      })),
    [update],
  );

  return { state, hydrated, update, updatePerson, updateCharge, addCharge, removeCharge, reset };
}
