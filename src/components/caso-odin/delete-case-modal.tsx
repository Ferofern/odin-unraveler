import { useState } from "react";
import { AlertTriangle, Trash2, X, Archive } from "lucide-react";

interface DeleteCaseModalProps {
  caseId: string;
  caseName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (caseId: string) => Promise<void>;
}

export function DeleteCaseModal({
  caseId,
  caseName,
  isOpen,
  onClose,
  onConfirmDelete,
}: DeleteCaseModalProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetPhrase = `Deseo borrar el caso ${caseName}`;
  const isMatch = typedConfirmation.trim() === targetPhrase.trim();

  const handleDelete = async () => {
    if (!isMatch) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await onConfirmDelete(caseId);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al eliminar el caso. Intente nuevamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg flex-col rounded-lg border border-destructive/60 bg-[linear-gradient(175deg,oklch(0.09_0.02_18),oklch(0.05_0.01_17))] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-dust hover:bg-wine/30 hover:text-parchment"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 text-destructive">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-destructive/15 border border-destructive/30">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-parchment">
              Eliminar Expediente: {caseName}
            </h3>
            <p className="text-[11px] text-dust">
              Acción protegida con confirmación obligatoria
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-xs text-dust">
          <p>
            ¿Está seguro de que desea borrar el caso <strong className="text-parchment">«{caseName}»</strong>?
          </p>
          <div className="rounded border border-wine-soft/40 bg-ink/70 p-3 text-[11.5px] text-parchment/90">
            <div className="flex items-center gap-1.5 font-semibold text-rose">
              <Archive className="h-4 w-4" /> Respaldo automático en papelera:
            </div>
            <p className="mt-1 text-dust">
              Toda la información del caso, sus implicados asignados, acusaciones, fojas y gestiones se guardarán íntegramente en la <strong className="text-parchment">papelera de reciclaje</strong> de la base de datos antes de ser removidos del tablero.
            </p>
          </div>

          <div className="mt-3">
            <label className="block text-[11px] uppercase tracking-wider text-parchment/80">
              Para confirmar, escriba exactamente la siguiente frase:
            </label>
            <div className="mt-1 select-all rounded border border-wine-soft/60 bg-ink px-3 py-1.5 font-mono text-xs font-semibold text-rose">
              {targetPhrase}
            </div>

            <input
              type="text"
              autoFocus
              placeholder={`Escriba: ${targetPhrase}`}
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              className="mt-2 w-full rounded border border-wine-soft/60 bg-ink px-3 py-2 text-xs text-parchment focus:border-rose focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p className="text-center text-xs font-semibold text-destructive">{errorMsg}</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-wine-soft/40 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-wine-soft/40 px-4 py-2 text-xs uppercase tracking-wider text-dust hover:text-parchment"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
            className="flex items-center gap-1.5 rounded bg-destructive px-5 py-2 text-xs font-semibold uppercase tracking-wider text-destructive-foreground transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Borrando y archivando..." : "Confirmar Eliminación"}
          </button>
        </div>
      </div>
    </div>
  );
}
