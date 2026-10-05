import { useState, useEffect } from "react";
import { X, RefreshCw, Check, CheckSquare, Square, AlertCircle } from "lucide-react";
import type { StoredCharge, StoredPerson } from "@/lib/caso-odin-store";
import { loadCasesList, loadCaseFromDb } from "@/lib/caso-odin-db.functions";
import type { CaseSummary } from "@/lib/caso-odin-db.server";

interface SyncModalProps {
  currentCaseId: string;
  targetPerson: StoredPerson;
  isOpen: boolean;
  onClose: () => void;
  onSyncCharges: (charges: StoredCharge[]) => Promise<number>;
}

export function SyncModal({
  currentCaseId,
  targetPerson,
  isOpen,
  onClose,
  onSyncCharges,
}: SyncModalProps) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [availablePeople, setAvailablePeople] = useState<StoredPerson[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [sourcePerson, setSourcePerson] = useState<StoredPerson | null>(null);
  const [selectedChargeIds, setSelectedChargeIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  // Cargar lista de casos al abrir
  useEffect(() => {
    if (!isOpen) {
      setResultMsg(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await loadCasesList();
        const otherCases = (res.cases || []).filter((c) => c.id !== currentCaseId);
        setCases(otherCases);
        const firstCase = otherCases[0];
        if (firstCase) {
          setSelectedCaseId(firstCase.id);
        }
      } catch (err) {
        console.error("Error loading cases for sync:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, currentCaseId]);

  // Cargar personas del caso seleccionado
  useEffect(() => {
    if (!selectedCaseId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await loadCaseFromDb({ data: { caseId: selectedCaseId } });
        if (res.payload) {
          const parsed = JSON.parse(res.payload);
          const people: StoredPerson[] = parsed.people || [];
          setAvailablePeople(people);

          // Intentar pre-seleccionar a la persona con el mismo nombre o cédula
          const match = people.find(
            (p) =>
              (targetPerson.cedula && p.cedula === targetPerson.cedula) ||
              p.name.trim().toLowerCase() === targetPerson.name.trim().toLowerCase()
          );
          if (match) {
            setSelectedPersonId(match.id);
            setSourcePerson(match);
          } else {
            const firstPerson = people[0];
            if (firstPerson) {
              setSelectedPersonId(firstPerson.id);
              setSourcePerson(firstPerson);
            } else {
              setSelectedPersonId("");
              setSourcePerson(null);
            }
          }
        }
      } catch (err) {
        console.error("Error loading source case:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCaseId, targetPerson]);

  // Cambiar persona origen
  useEffect(() => {
    if (!selectedPersonId) {
      setSourcePerson(null);
      setSelectedChargeIds(new Set());
      return;
    }
    const found = availablePeople.find((p) => p.id === selectedPersonId) || null;
    setSourcePerson(found);
    if (found) {
      // Seleccionar por defecto todas las que NO existan ya
      const existingTitles = new Set(
        targetPerson.charges.map((c) => c.title.trim().toLowerCase())
      );
      const toSelect = new Set<string>();
      found.charges.forEach((c) => {
        if (!existingTitles.has(c.title.trim().toLowerCase())) {
          toSelect.add(c.id);
        }
      });
      setSelectedChargeIds(toSelect);
    }
  }, [selectedPersonId, availablePeople, targetPerson.charges]);

  if (!isOpen) return null;

  const existingTitles = new Set(
    targetPerson.charges.map((c) => c.title.trim().toLowerCase())
  );

  const toggleSelectAll = () => {
    if (!sourcePerson) return;
    const selectable = sourcePerson.charges.filter(
      (c) => !existingTitles.has(c.title.trim().toLowerCase())
    );
    if (selectedChargeIds.size === selectable.length) {
      setSelectedChargeIds(new Set());
    } else {
      setSelectedChargeIds(new Set(selectable.map((c) => c.id)));
    }
  };

  const toggleCharge = (chargeId: string) => {
    setSelectedChargeIds((prev) => {
      const next = new Set(prev);
      if (next.has(chargeId)) next.delete(chargeId);
      else next.add(chargeId);
      return next;
    });
  };

  const handleExecuteSync = async () => {
    if (!sourcePerson || selectedChargeIds.size === 0) return;
    setSyncing(true);
    try {
      const chargesToSync = sourcePerson.charges.filter((c) =>
        selectedChargeIds.has(c.id)
      );
      const added = await onSyncCharges(chargesToSync);
      setResultMsg(`¡Sincronización completada! Se añadieron ${added} acusación(es) nueva(s).`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
      setResultMsg("Error al sincronizar acusaciones.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-wine-soft/60 bg-[linear-gradient(175deg,oklch(0.09_0.02_18),oklch(0.05_0.01_17))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-wine-soft/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-rose" />
            <h3 className="font-display text-lg font-bold text-parchment">
              Sincronizar Acusaciones con Otro Caso
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-dust hover:bg-wine/30 hover:text-parchment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm text-foreground">
          <div className="rounded border border-wine-soft/30 bg-ink/50 p-3 text-xs text-dust">
            Destino: <strong className="text-parchment">{targetPerson.name}</strong>{" "}
            {targetPerson.cedula ? `(C.I. ${targetPerson.cedula})` : ""} · Este implicado tiene actualmente{" "}
            <span className="text-rose font-semibold">{targetPerson.charges.length}</span> acusación(es).
          </div>

          {cases.length === 0 ? (
            <div className="py-6 text-center text-dust">
              No hay otros casos creados en el sistema para sincronizar información.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-dust">
                    1. Caso de Origen
                  </label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="mt-1 w-full rounded border border-wine-soft/50 bg-ink px-3 py-2 text-xs text-parchment focus:border-rose focus:outline-none"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.tipo_penal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-dust">
                    2. Implicado en Caso Origen
                  </label>
                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="mt-1 w-full rounded border border-wine-soft/50 bg-ink px-3 py-2 text-xs text-parchment focus:border-rose focus:outline-none"
                    disabled={availablePeople.length === 0}
                  >
                    {availablePeople.length === 0 ? (
                      <option value="">(Sin implicados en este caso)</option>
                    ) : (
                      availablePeople.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.cedula ? `[${p.cedula}]` : ""} ({p.charges.length} acusaciones)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Lista de Acusaciones para Sincronizar */}
              <div className="mt-4">
                <div className="flex items-center justify-between border-b border-wine-soft/30 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-dust">
                    3. Selecciona las acusaciones que deseas sincronizar
                  </span>
                  {sourcePerson && sourcePerson.charges.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-rose hover:text-parchment"
                    >
                      {selectedChargeIds.size > 0 ? (
                        <CheckSquare className="h-3.5 w-3.5" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                      Seleccionar todas
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-dust">
                    Cargando información del caso seleccionado…
                  </div>
                ) : !sourcePerson || sourcePerson.charges.length === 0 ? (
                  <div className="py-6 text-center text-xs text-dust">
                    Este implicado no tiene acusaciones en el caso seleccionado.
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {sourcePerson.charges.map((c) => {
                      const alreadyExists = existingTitles.has(c.title.trim().toLowerCase());
                      const isSelected = selectedChargeIds.has(c.id);

                      return (
                        <li
                          key={c.id}
                          onClick={() => {
                            if (!alreadyExists) toggleCharge(c.id);
                          }}
                          className={`flex items-start gap-3 rounded border p-3 transition-colors ${
                            alreadyExists
                              ? "cursor-not-allowed border-wine-soft/20 bg-ink/30 opacity-60"
                              : isSelected
                                ? "cursor-pointer border-rose/80 bg-wine/30"
                                : "cursor-pointer border-wine-soft/40 bg-ink/60 hover:border-parchment/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={alreadyExists}
                            onChange={() => {}}
                            className="mt-1 rounded accent-rose"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-parchment">{c.title}</span>
                              <span className="text-[10px] uppercase tracking-wider text-dust">
                                {c.year}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-dust">
                              {c.fields?.find((f) => f.label === "La justificación")?.text ||
                                "(Sin justificación detallada)"}
                            </p>
                            {alreadyExists && (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-wine/50 px-2 py-0.5 text-[9px] uppercase tracking-wider text-rose">
                                <AlertCircle className="h-2.5 w-2.5" /> Ya existe en este caso (se omitirá)
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}

          {resultMsg && (
            <div className="rounded border border-rose/60 bg-wine/40 p-3 text-center text-xs font-semibold text-parchment">
              {resultMsg}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-end gap-3 border-t border-wine-soft/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-wine-soft/40 px-4 py-2 text-xs uppercase tracking-wider text-dust transition-colors hover:text-parchment"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecuteSync}
            disabled={syncing || selectedChargeIds.size === 0}
            className="flex items-center gap-2 rounded bg-rose px-5 py-2 text-xs font-semibold uppercase tracking-wider text-parchment transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Sincronizar ({selectedChargeIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}
