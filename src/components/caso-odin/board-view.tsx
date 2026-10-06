import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  Users,
  Palette,
  RotateCcw,
  Save,
  Check,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Editable } from "./editable";
import { PersonNode } from "./person-node";
import { CaseDetail } from "./case-detail";
import { ImportPersonModal } from "./import-person-modal";
import { SyncModal } from "./sync-modal";
import { RecycleBinModal } from "./recycle-bin-modal";
import { useCaseState, type StoredPerson, type StoredCharge } from "@/lib/caso-odin-store";

interface BoardViewProps {
  caseId: string;
  onBackToCases: () => void;
}

export function BoardView({ caseId, onBackToCases }: BoardViewProps) {
  const {
    state,
    hydrated,
    remoteStatus,
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
    reloadFromDb,
  } = useCaseState(caseId);

  const stageRef = useRef<HTMLDivElement>(null);
  const [openPersonId, setOpenPersonId] = useState<string | null>(null);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isToolbarSyncOpen, setIsToolbarSyncOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [toolbarSyncTargetPerson, setToolbarSyncTargetPerson] = useState<StoredPerson | null>(null);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openPerson = useMemo(
    () => state.people.find((p) => p.id === openPersonId) ?? null,
    [state.people, openPersonId],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (e.key === "Escape" && !el?.isContentEditable) {
        setOpenPersonId(null);
        setSelectedChargeId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const watermark = useMemo(
    () => `EXPEDIENTE: ${state.title.toUpperCase()}   `.repeat(160),
    [state.title],
  );

  const handleManualSave = async () => {
    setIsManualSaving(true);
    const ok = await saveBoard();
    setIsManualSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const currentTheme = state.estilo || "penal";

  return (
    <div
      data-theme={currentTheme}
      className="font-body relative h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300"
    >
      <div className="grid-odin pointer-events-none fixed inset-0 z-0" />
      <div
        aria-hidden
        className="font-display pointer-events-none fixed -inset-[20%] z-0 whitespace-pre-wrap break-words text-[26px] uppercase leading-[5.2] tracking-[0.28em] text-white opacity-[0.028] [transform:rotate(-24deg)]"
      >
        {watermark}
      </div>
      <div className="vignette-odin pointer-events-none fixed inset-0 z-[1]" />

      {/* Cabecera del Tablero */}
      <header className="fixed inset-x-0 top-0 z-[10] flex flex-wrap items-center justify-between gap-4 border-b border-wine-soft/35 bg-[linear-gradient(180deg,oklch(0.05_0.01_17/0.95),transparent)] px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackToCases}
            className="flex items-center gap-1.5 rounded border border-wine-soft/50 bg-ink/75 px-3 py-1.5 text-xs uppercase tracking-wider text-parchment transition-all hover:bg-wine hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Casos</span>
          </button>

          <div className="flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.34em] text-wine-soft">
              <Editable
                value={state.kicker}
                onCommit={(v) => update((p) => ({ ...p, kicker: v }))}
              />
            </p>
            <h1 className="font-display text-xl font-bold tracking-wide text-parchment">
              <Editable
                value={state.title}
                onCommit={(v) => update((p) => ({ ...p, title: v }))}
              />
            </h1>
          </div>
        </div>

        {/* Acciones Centrales / Estilo */}
        <div className="flex items-center gap-3">
          {/* Selector de Estilo */}
          <div className="flex items-center gap-1.5 rounded-md border border-wine-soft/50 bg-ink/80 px-2 py-1 text-xs">
            <Palette className="h-3.5 w-3.5 text-rose" />
            <span className="text-[10px] uppercase tracking-wider text-dust">Estilo:</span>
            <select
              value={currentTheme}
              onChange={(e) => setEstilo(e.target.value as any)}
              className="bg-transparent text-[11px] font-semibold text-parchment outline-none cursor-pointer"
            >
              <option value="penal" className="bg-ink text-parchment">
                Penal (Noir)
              </option>
              <option value="civil" className="bg-ink text-parchment">
                Civil (Medianoche)
              </option>
              <option value="familiar" className="bg-ink text-parchment">
                Familiar (Esmeralda)
              </option>
            </select>
          </div>

          <p className="hidden max-w-[320px] text-right text-[11px] leading-relaxed text-dust lg:block">
            <span className="font-semibold text-parchment">Materia: </span>
            <Editable
              value={state.charge}
              onCommit={(v) => update((p) => ({ ...p, charge: v }))}
              multiline
            />
          </p>
        </div>
      </header>

      {/* Escenario del Tablero */}
      <div
        ref={stageRef}
        className="absolute inset-0 z-[3]"
        onClick={() => {
          setOpenPersonId(null);
          setSelectedChargeId(null);
        }}
      >
        {hydrated
          ? state.people.map((person) => (
              <PersonNode
                key={person.id}
                person={person}
                active={openPersonId === person.id}
                stageRef={stageRef}
                onSelect={() => {
                  setOpenPersonId(person.id);
                  setSelectedChargeId(person.charges[0]?.id ?? null);
                }}
                onPatch={(patch) => updatePerson(person.id, patch)}
                onRemove={() => {
                  removePerson(person.id);
                  if (openPersonId === person.id) {
                    setOpenPersonId(null);
                    setSelectedChargeId(null);
                  }
                }}
              />
            ))
          : null}
      </div>

      {/* Barra de Herramientas Inferior */}
      <div className="fixed bottom-4 right-6 z-[30] flex items-center gap-3 rounded-md border border-wine-soft/60 bg-ink/85 px-3 py-2 shadow-2xl backdrop-blur-md">
        {/* Importar implicado de la BD */}
        <button
          type="button"
          title="Importar un implicado o cliente existente en la base de datos a este tablero"
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-1.5 px-1.5 text-[10px] uppercase tracking-[0.2em] text-dust transition-colors hover:text-parchment"
        >
          <Users className="h-3.5 w-3.5 text-rose" /> Importar cliente
        </button>

        <span className="h-4 w-px bg-wine-soft/50" />

        {/* Añadir nuevo implicado */}
        <button
          type="button"
          title="Añadir un nuevo implicado en blanco al tablero"
          onClick={() => {
            const created = addPerson();
            if (created) {
              setOpenPersonId(null);
              setSelectedChargeId(null);
            }
          }}
          className="flex items-center gap-1.5 px-1.5 text-[10px] uppercase tracking-[0.2em] text-rose transition-colors hover:text-parchment"
        >
          <UserPlus className="h-3.5 w-3.5" /> Nuevo implicado
        </button>

        <span className="h-4 w-px bg-wine-soft/50" />

        {/* Sincronizar (Opción C: Botón en barra de herramientas) */}
        {state.people.length > 0 && (
          <>
            <button
              type="button"
              title="Sincronizar acusaciones con otros casos"
              onClick={() => {
                setToolbarSyncTargetPerson(state.people[0] ?? null);
                setIsToolbarSyncOpen(true);
              }}
              className="flex items-center gap-1.5 px-1.5 text-[10px] uppercase tracking-[0.2em] text-dust transition-colors hover:text-parchment"
            >
              <RefreshCw className="h-3.5 w-3.5 text-rose" /> Sincronizar
            </button>
            <span className="h-4 w-px bg-wine-soft/50" />
          </>
        )}

        {/* Guardar Tablero */}
        <button
          type="button"
          title="Guardar cambios del tablero en la base de datos"
          onClick={handleManualSave}
          disabled={isManualSaving}
          className="flex items-center gap-1.5 rounded bg-rose/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose transition-all hover:bg-rose hover:text-parchment"
        >
          {isManualSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saveSuccess ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saveSuccess ? "Guardado" : "Guardar"}
        </button>

        <span className="h-4 w-px bg-wine-soft/50" />

        {/* Papelera de Reciclaje */}
        <button
          type="button"
          title="Ver elementos borrados en la papelera de reciclaje"
          onClick={() => setIsRecycleBinOpen(true)}
          className="flex items-center gap-1.5 px-1.5 text-[10px] uppercase tracking-[0.2em] text-dust transition-colors hover:text-parchment"
        >
          <Trash2 className="h-3.5 w-3.5 text-rose" /> Papelera
        </button>

        <span className="h-4 w-px bg-wine-soft/50" />

        <span
          title={
            remoteStatus === "local"
              ? "Modo Local: los cambios se guardan en este navegador"
              : "Sincronizado con Supabase"
          }
          className="px-1 text-[10px] uppercase tracking-[0.18em] text-dust"
        >
          {remoteStatus === "local"
            ? "Local"
            : remoteStatus === "syncing"
              ? "Guardando…"
              : remoteStatus === "synced"
                ? "BD Conectada"
                : "Error BD"}
        </span>

        <span className="h-4 w-px bg-wine-soft/50" />

        <button
          type="button"
          title="Restablecer este expediente a los datos originales"
          onClick={() => {
            if (window.confirm("¿Restablecer este expediente a su estado inicial?")) {
              reset();
              setOpenPersonId(null);
              setSelectedChargeId(null);
            }
          }}
          className="flex items-center gap-1 px-1 text-[10px] uppercase tracking-[0.2em] text-dust transition-colors hover:text-parchment"
        >
          <RotateCcw className="h-3 w-3" /> Restablecer
        </button>
      </div>

      <p className="fixed inset-x-0 bottom-6 z-[4] text-center text-[10.5px] uppercase tracking-[0.24em] text-dust pointer-events-none">
        Clic en un implicado para abrir su expediente · Arrastre el ícono para moverlo · Esquina inferior para
        redimensionar
      </p>

      {/* Detalle del Implicado */}
      {openPerson ? (
        <CaseDetail
          person={openPerson}
          currentCaseId={caseId}
          selectedChargeId={selectedChargeId}
          onSelectCharge={setSelectedChargeId}
          onPatchPerson={(patch) => updatePerson(openPerson.id, patch)}
          onPatchCharge={(chargeId, patch) => updateCharge(openPerson.id, chargeId, patch)}
          onAddCharge={() => {
            const created = addCharge(openPerson.id);
            if (created) setSelectedChargeId(created);
          }}
          onRemoveCharge={(chargeId) => {
            if (!window.confirm("¿Eliminar esta acusación? Se enviará a la papelera de reciclaje.")) return;
            removeCharge(openPerson.id, chargeId);
            if (selectedChargeId === chargeId) setSelectedChargeId(null);
          }}
          onMoveCharge={(fromId, toId) => moveCharge(openPerson.id, fromId, toId)}
          onSyncCharges={(charges) => syncChargesToPerson(openPerson.id, charges)}
          onClose={() => {
            setOpenPersonId(null);
            setSelectedChargeId(null);
          }}
        />
      ) : null}

      {/* Modal de Importar Implicado / Cliente */}
      {isImportModalOpen && (
        <ImportPersonModal
          currentCaseId={caseId}
          existingPersonIds={state.people.map((p) => p.id)}
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportPerson={(person, includeDetails) => {
            importPersonToBoard(person, includeDetails);
          }}
        />
      )}

      {/* Modal de Sincronización desde Barra de Herramientas */}
      {isToolbarSyncOpen && toolbarSyncTargetPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-wine-soft/60 bg-[linear-gradient(175deg,oklch(0.09_0.02_18),oklch(0.05_0.01_17))] p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-wine-soft/40 pb-2">
              <span className="text-xs uppercase tracking-wider text-parchment font-semibold">
                Selecciona el implicado de este caso para sincronizarle información:
              </span>
              <button
                onClick={() => setIsToolbarSyncOpen(false)}
                className="text-dust hover:text-parchment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {state.people.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setToolbarSyncTargetPerson(p)}
                  className={`rounded px-3 py-1.5 text-xs transition-colors ${
                    toolbarSyncTargetPerson.id === p.id
                      ? "bg-rose text-parchment font-semibold"
                      : "border border-wine-soft/40 bg-ink/60 text-dust hover:text-parchment"
                  }`}
                >
                  {p.name} {p.cedula ? `(${p.cedula})` : ""}
                </button>
              ))}
            </div>

            <SyncModal
              currentCaseId={caseId}
              targetPerson={toolbarSyncTargetPerson}
              isOpen={true}
              onClose={() => setIsToolbarSyncOpen(false)}
              onSyncCharges={(charges) => syncChargesToPerson(toolbarSyncTargetPerson.id, charges)}
            />
          </div>
        </div>
      )}

      {/* Modal de Papelera de Reciclaje */}
      {isRecycleBinOpen && (
        <RecycleBinModal
          currentCaseId={caseId}
          isOpen={isRecycleBinOpen}
          onClose={() => setIsRecycleBinOpen(false)}
          onItemRestored={() => {
            reloadFromDb();
          }}
        />
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
