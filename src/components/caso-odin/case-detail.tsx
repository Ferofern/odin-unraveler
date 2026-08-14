import { useState } from "react";
import { Plus, Trash2, X, GripVertical } from "lucide-react";
import { Editable } from "./editable";
import { ProofRow } from "./proof-row";
import {
  uid,
  textField,
  listField,
  type CaseField,
  type StoredCharge,
  type StoredPerson,
} from "@/lib/caso-odin-store";

interface CaseDetailProps {
  person: StoredPerson;
  selectedChargeId: string | null;
  onSelectCharge: (id: string) => void;
  onPatchCharge: (chargeId: string, patch: Partial<StoredCharge>) => void;
  onAddCharge: () => void;
  onRemoveCharge: (chargeId: string) => void;
  onClose: () => void;
}

export function CaseDetail({
  person,
  selectedChargeId,
  onSelectCharge,
  onPatchCharge,
  onAddCharge,
  onRemoveCharge,
  onClose,
}: CaseDetailProps) {
  const charge = person.charges.find((c) => c.id === selectedChargeId) ?? person.charges[0] ?? null;
  const [dragId, setDragId] = useState<string | null>(null);

  const setFields = (fields: CaseField[]) => {
    if (charge) onPatchCharge(charge.id, { fields });
  };

  const patchField = (fieldId: string, patch: Partial<CaseField>) => {
    if (!charge) return;
    setFields(charge.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)));
  };

  const moveField = (fromId: string, toId: string) => {
    if (!charge || fromId === toId) return;
    const list = [...charge.fields];
    const from = list.findIndex((f) => f.id === fromId);
    const to = list.findIndex((f) => f.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    if (moved) list.splice(to, 0, moved);
    setFields(list);
  };

  const addField = () => {
    if (!charge) return;
    const name = window.prompt("Nombre del nuevo campo:", "");
    if (!name || !name.trim()) return;
    const asList = window.confirm(
      "¿El campo será una lista de elementos con enlaces (Aceptar) o un texto libre (Cancelar)?",
    );
    setFields([
      ...charge.fields,
      asList ? listField(name.trim(), "proofs") : textField(name.trim()),
    ]);
  };

  return (
    <section
      className="fixed inset-0 z-30 flex flex-col bg-[linear-gradient(180deg,oklch(0.08_0.02_18),oklch(0.05_0.01_17)_45%)] md:flex-row"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 30% — Acusaciones */}
      <aside className="flex max-h-[45vh] w-full flex-col border-b border-wine-soft/40 md:max-h-none md:w-[30%] md:border-b-0 md:border-r">
        <header className="border-b border-wine-soft/40 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-wine-soft">{person.role}</p>
          <h2 className="font-display mt-2 break-words text-lg leading-tight text-parchment">
            {person.name}
          </h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-dust">
            {person.charges.length} {person.charges.length === 1 ? "acusación" : "acusaciones"}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="flex flex-col gap-2">
            {person.charges.map((c) => {
              const isActive = charge?.id === c.id;
              return (
                <li key={c.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectCharge(c.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelectCharge(c.id)}
                    className={`group relative cursor-pointer rounded border px-3 py-3 pr-9 text-left transition-colors ${
                      isActive
                        ? "border-rose/70 bg-wine/40"
                        : "border-wine-soft/40 bg-ink/60 hover:border-parchment/40 hover:bg-wine/20"
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-xs font-bold text-rose">{c.year}</span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-dust">{c.n}</span>
                    </div>
                    <p className="mt-1 break-words text-[11.5px] leading-snug text-parchment/85">
                      {c.title.length > 78 ? `${c.title.slice(0, 75)}…` : c.title}
                    </p>
                    <button
                      type="button"
                      title="Eliminar acusación"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCharge(c.id);
                      }}
                      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded border border-parchment/25 text-parchment/70 opacity-0 transition-opacity hover:bg-wine hover:text-parchment group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={onAddCharge}
            className="mt-4 flex w-full items-center justify-center gap-2 border border-wine-soft px-3 py-2.5 text-[10px] uppercase tracking-[0.2em] text-rose transition-colors hover:bg-wine hover:text-parchment"
          >
            <Plus className="h-3 w-3" /> Añadir acusación
          </button>
        </div>
      </aside>

      {/* 70% — Campos y detalle */}
      <div className="relative flex w-full flex-1 flex-col md:w-[70%]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full border border-parchment/25 text-parchment transition-colors hover:bg-wine"
        >
          <X className="h-4 w-4" />
        </button>

        {charge ? (
          <>
            <header className="border-b border-wine-soft/40 px-8 py-6 pr-16">
              <p className="text-[10px] uppercase tracking-[0.3em] text-wine-soft">{charge.n}</p>
              <h3 className="font-display mt-2 text-xl leading-snug text-parchment">
                <Editable
                  value={charge.title}
                  onCommit={(v) => onPatchCharge(charge.id, { title: v })}
                  placeholder="Título de la acusación"
                  multiline
                />
              </h3>
              <div className="mt-3 inline-block border border-wine-soft px-2.5 py-1 text-[10px] tracking-[0.2em] text-parchment">
                <Editable
                  value={charge.year}
                  onCommit={(v) => onPatchCharge(charge.id, { year: v || "S/F" })}
                  placeholder="Año"
                />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-8 pb-16 pt-6">
              {charge.fields.map((field) => (
                <div
                  key={field.id}
                  onDragOver={(e) => {
                    if (dragId) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) moveField(dragId, field.id);
                    setDragId(null);
                  }}
                  className={`mb-7 rounded ${dragId === field.id ? "opacity-50" : ""}`}
                >
                  <div className="group/field mb-2.5 flex items-center gap-2 border-b border-parchment/10 pb-1.5">
                    <span
                      draggable
                      title="Arrastre para reordenar el campo"
                      onDragStart={() => setDragId(field.id)}
                      onDragEnd={() => setDragId(null)}
                      className="cursor-grab text-parchment/35 hover:text-parchment active:cursor-grabbing"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="flex-1 text-[10px] uppercase tracking-[0.28em] text-rose">
                      <Editable
                        value={field.label}
                        onCommit={(v) => patchField(field.id, { label: v || field.label })}
                        placeholder="Nombre del campo"
                      />
                    </h4>
                    <button
                      type="button"
                      title="Eliminar campo"
                      onClick={() => {
                        if (!window.confirm("¿Está seguro de que desea eliminar este campo?")) return;
                        setFields(charge.fields.filter((f) => f.id !== field.id));
                      }}
                      className="grid h-6 w-6 place-items-center rounded border border-parchment/25 text-parchment/70 opacity-0 transition-opacity hover:bg-wine hover:text-parchment group-hover/field:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {field.type === "text" ? (
                    <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-parchment/85">
                      <Editable
                        value={field.text}
                        onCommit={(v) => patchField(field.id, { text: v })}
                        placeholder="Sin información registrada."
                        multiline
                      />
                    </p>
                  ) : (
                    <>
                      {field.items.length === 0 ? (
                        <p className="text-xs italic text-dust">Sin registros.</p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {field.items.map((item) => (
                            <ProofRow
                              key={item.id}
                              item={item}
                              icon={field.type === "proofs" ? "foja" : "task"}
                              placeholder={field.type === "proofs" ? "Foja …" : "Gestión pendiente"}
                              onChange={(patch) =>
                                patchField(field.id, {
                                  items: field.items.map((it) =>
                                    it.id === item.id ? { ...it, ...patch } : it,
                                  ),
                                })
                              }
                              onRemove={() =>
                                patchField(field.id, {
                                  items: field.items.filter((it) => it.id !== item.id),
                                })
                              }
                            />
                          ))}
                        </ul>
                      )}
                      <AddButton
                        label={field.type === "proofs" ? "Añadir foja" : "Añadir elemento"}
                        onClick={() =>
                          patchField(field.id, {
                            items: [...field.items, { id: uid("it"), label: "Nuevo registro", url: "" }],
                          })
                        }
                      />
                    </>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-2 border border-wine-soft px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-rose transition-colors hover:bg-wine hover:text-parchment"
              >
                <Plus className="h-3 w-3" /> Añadir campo
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-8 text-center">
            <p className="max-w-sm text-sm text-dust">
              Este implicado no tiene acusaciones registradas. Use «Añadir acusación» para crear la primera.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 flex items-center gap-1.5 border border-wine-soft px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-rose transition-colors hover:bg-wine hover:text-parchment"
    >
      <Plus className="h-3 w-3" /> {label}
    </button>
  );
}
