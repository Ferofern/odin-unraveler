import { useState } from "react";
import { Plus, Trash2, X, GripVertical, RefreshCw } from "lucide-react";
import { Editable } from "./editable";
import { ProofRow } from "./proof-row";
import { SyncModal } from "./sync-modal";
import {
  uid,
  textField,
  listField,
  type Proof,
  type CaseField,
  type StoredCharge,
  type StoredPerson,
} from "@/lib/caso-odin-store";

interface CaseDetailProps {
  person: StoredPerson;
  currentCaseId?: string;
  selectedChargeId: string | null;
  onSelectCharge: (id: string) => void;
  onPatchPerson?: (patch: Partial<StoredPerson>) => void;
  onPatchCharge: (chargeId: string, patch: Partial<StoredCharge>) => void;
  onAddCharge: () => void;
  onRemoveCharge: (chargeId: string) => void;
  onMoveCharge: (fromId: string, toId: string) => void;
  onSyncCharges?: (charges: StoredCharge[]) => Promise<number>;
  onClose: () => void;
}

export function CaseDetail({
  person,
  currentCaseId = "caso-odin",
  selectedChargeId,
  onSelectCharge,
  onPatchPerson,
  onPatchCharge,
  onAddCharge,
  onRemoveCharge,
  onMoveCharge,
  onSyncCharges,
  onClose,
}: CaseDetailProps) {
  const charge = person.charges.find((c) => c.id === selectedChargeId) ?? person.charges[0] ?? null;
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragChargeId, setDragChargeId] = useState<string | null>(null);
  const [overChargeId, setOverChargeId] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<{ fieldId: string; itemId: string } | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const setFields = (fields: CaseField[]) => {
    if (charge) onPatchCharge(charge.id, { fields });
  };

  const patchField = (fieldId: string, patch: Partial<CaseField>) => {
    if (!charge) return;
    setFields(charge.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)));
  };

  const moveItem = (fieldId: string, fromId: string, toId: string) => {
    if (!charge || fromId === toId) return;
    const field = charge.fields.find((f) => f.id === fieldId);
    if (!field) return;
    const list = [...field.items];
    const from = list.findIndex((it) => it.id === fromId);
    const to = list.findIndex((it) => it.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    if (moved) list.splice(to, 0, moved);
    patchField(fieldId, { items: list });
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
      <aside className="flex max-h-[48vh] w-full flex-col border-b border-wine-soft/40 md:max-h-none md:w-[32%] md:border-b-0 md:border-r">
        <header className="border-b border-wine-soft/40 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.3em] text-wine-soft">
              {onPatchPerson ? (
                <Editable value={person.role} onCommit={(v) => onPatchPerson({ role: v || person.role })} />
              ) : (
                person.role
              )}
            </p>
            {onSyncCharges && (
              <button
                type="button"
                title="Sincronizar acusaciones de este implicado con otro caso"
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center gap-1.5 rounded border border-wine-soft/60 bg-ink/80 px-2 py-1 text-[10px] uppercase tracking-wider text-rose transition-colors hover:border-rose hover:text-parchment"
              >
                <RefreshCw className="h-3 w-3" /> Sincronizar
              </button>
            )}
          </div>

          <h2 className="font-display mt-1 break-words text-lg leading-tight text-parchment">
            {onPatchPerson ? (
              <Editable value={person.name} onCommit={(v) => onPatchPerson({ name: v || person.name })} />
            ) : (
              person.name
            )}
          </h2>

          {/* Ficha editable del cliente / implicado */}
          <div className="mt-3 space-y-1.5 rounded border border-wine-soft/30 bg-ink/40 p-2.5 text-[11px] text-dust">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-parchment/80">C.I. / Cédula:</span>
              {onPatchPerson ? (
                <Editable
                  value={person.cedula || ""}
                  placeholder="Clic para agregar cédula"
                  onCommit={(v) => onPatchPerson({ cedula: v })}
                  className="font-mono text-rose"
                />
              ) : (
                <span className="font-mono text-rose">{person.cedula || "No registrada"}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-parchment/80">Teléfono:</span>
              {onPatchPerson ? (
                <Editable
                  value={person.telefono || ""}
                  placeholder="Clic para agregar teléfono"
                  onCommit={(v) => onPatchPerson({ telefono: v })}
                />
              ) : (
                <span>{person.telefono || "No registrado"}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-parchment/80">Correo:</span>
              {onPatchPerson ? (
                <Editable
                  value={person.email || ""}
                  placeholder="Clic para agregar email"
                  onCommit={(v) => onPatchPerson({ email: v })}
                />
              ) : (
                <span>{person.email || "No registrado"}</span>
              )}
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-semibold text-parchment/80">Dirección:</span>
              {onPatchPerson ? (
                <Editable
                  value={person.direccion || ""}
                  placeholder="Clic para agregar dirección"
                  onCommit={(v) => onPatchPerson({ direccion: v })}
                  multiline
                />
              ) : (
                <span>{person.direccion || "No registrada"}</span>
              )}
            </div>
          </div>

          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-dust">
            {person.charges.length} {person.charges.length === 1 ? "acusación registrada" : "acusaciones registradas"}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="flex flex-col gap-2">
            {person.charges.map((c, idx) => {
              const isActive = charge?.id === c.id;
              const displayN = `ACUSACIÓN ${idx + 1}`;

              return (
                <li
                  key={c.id}
                  onDragOver={(e) => {
                    if (!dragChargeId) return;
                    e.preventDefault();
                    setOverChargeId(c.id);
                  }}
                  onDragLeave={() => setOverChargeId((prev) => (prev === c.id ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragChargeId) onMoveCharge(dragChargeId, c.id);
                    setDragChargeId(null);
                    setOverChargeId(null);
                  }}
                  className={`rounded ${dragChargeId === c.id ? "opacity-40" : ""} ${
                    overChargeId === c.id && dragChargeId && dragChargeId !== c.id
                      ? "ring-1 ring-rose/70"
                      : ""
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectCharge(c.id)}
                    onKeyDown={(e) => e.key === "Enter" && onSelectCharge(c.id)}
                    className={`group relative cursor-pointer rounded border px-3 py-3 pl-8 pr-9 text-left transition-colors ${
                      isActive
                        ? "border-rose/70 bg-wine/40"
                        : "border-wine-soft/40 bg-ink/60 hover:border-parchment/40 hover:bg-wine/20"
                    }`}
                  >
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDragChargeId(c.id);
                      }}
                      onDragEnd={() => setDragChargeId(null)}
                      title="Arrastre para reordenar"
                      className="absolute left-2 top-3.5 grid h-5 w-4 cursor-grab place-items-center text-dust opacity-0 transition-opacity hover:text-parchment group-hover:opacity-100 active:cursor-grabbing"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>

                    <button
                      type="button"
                      title="Eliminar acusación"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCharge(c.id);
                      }}
                      className="absolute right-2 top-3 grid h-6 w-6 place-items-center rounded text-dust opacity-0 transition-opacity hover:bg-wine hover:text-parchment group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-wine-soft">
                      <span>{displayN}</span>
                      <Editable
                        value={c.year}
                        onCommit={(v) => onPatchCharge(c.id, { year: v || "S/F" })}
                        className="text-dust"
                      />
                    </div>
                    <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-parchment">
                      {c.title}
                    </h3>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={onAddCharge}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-wine-soft/60 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-rose transition-colors hover:border-parchment hover:bg-wine/20 hover:text-parchment"
          >
            <Plus className="h-3 w-3" /> Añadir acusación
          </button>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute right-6 top-6 z-10 grid h-8 w-8 place-items-center rounded border border-wine-soft/50 bg-ink/80 text-parchment transition-colors hover:bg-wine"
        >
          <X className="h-4 w-4" />
        </button>

        {charge ? (
          <>
            <header className="border-b border-wine-soft/40 px-8 py-7 pr-20">
              <p className="text-[10px] uppercase tracking-[0.3em] text-wine-soft">
                {charge.n} · Año {charge.year}
              </p>
              <h2 className="font-display mt-2 text-xl font-bold tracking-wide text-parchment">
                <Editable
                  value={charge.title}
                  onCommit={(v) => onPatchCharge(charge.id, { title: v || charge.title })}
                />
              </h2>
            </header>

            <div className="flex-1 space-y-6 px-8 py-7">
              {charge.fields.map((field) => (
                <div
                  key={field.id}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                  }}
                  onDrop={() => {
                    if (dragId) moveField(dragId, field.id);
                    setDragId(null);
                  }}
                  className={`group relative border-l-2 border-wine-soft/40 pl-4 transition-all ${
                    dragId === field.id ? "opacity-30" : ""
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        draggable
                        onDragStart={() => setDragId(field.id)}
                        onDragEnd={() => setDragId(null)}
                        className="cursor-grab text-dust opacity-0 transition-opacity hover:text-parchment group-hover:opacity-100 active:cursor-grabbing"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </span>
                      <h4 className="text-[10px] uppercase tracking-[0.25em] text-wine-soft">
                        <Editable
                          value={field.label}
                          onCommit={(v) => patchField(field.id, { label: v || field.label })}
                        />
                      </h4>
                    </div>

                    <button
                      type="button"
                      title="Eliminar este campo"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el campo «${field.label}»?`)) {
                          setFields(charge.fields.filter((f) => f.id !== field.id));
                        }
                      }}
                      className="opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-dust" />
                    </button>
                  </div>

                  {field.type === "text" ? (
                    <div className="text-sm leading-relaxed text-parchment/90">
                      <Editable
                        value={field.text}
                        onCommit={(v) => patchField(field.id, { text: v })}
                        multiline
                        placeholder="Clic para escribir..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {field.items.map((it) => (
                        <ProofRow
                          key={it.id}
                          item={it}
                          icon={field.type === "proofs" ? "foja" : "task"}
                          placeholder={field.type === "proofs" ? "Foja / prueba..." : "Gestión pendiente..."}
                          onChange={(p: Partial<Proof>) => {
                            patchField(field.id, {
                              items: field.items.map((x) => (x.id === it.id ? { ...x, ...p } : x)),
                            });
                          }}
                          onRemove={() => {
                            patchField(field.id, {
                              items: field.items.filter((x) => x.id !== it.id),
                            });
                          }}
                          onDragStartItem={() => setDragItem({ fieldId: field.id, itemId: it.id })}
                          onDragEndItem={() => setDragItem(null)}
                          onDropItem={() => {
                            if (dragItem?.fieldId === field.id) {
                              moveItem(field.id, dragItem.itemId, it.id);
                              setDragItem(null);
                            }
                          }}
                        />
                      ))}
                      <AddButton
                        label={field.type === "proofs" ? "Añadir foja / prueba" : "Añadir gestión"}
                        onClick={() => {
                          const label = window.prompt("Descripción o nombre:", "");
                          if (!label?.trim()) return;
                          patchField(field.id, {
                            items: [...field.items, { id: uid("it"), label: label.trim(), url: "" }],
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addField}
                className="mt-6 flex items-center gap-1.5 border border-dashed border-wine-soft/60 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-rose transition-colors hover:border-parchment hover:text-parchment"
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

      {isSyncModalOpen && onSyncCharges && (
        <SyncModal
          currentCaseId={currentCaseId}
          targetPerson={person}
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          onSyncCharges={onSyncCharges}
        />
      )}
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