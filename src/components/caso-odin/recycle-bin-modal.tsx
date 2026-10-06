import { useState, useEffect } from "react";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  FileText,
  UserX,
  CheckSquare,
  Briefcase,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  loadRecycleBinFn,
  restoreRecycleItemFn,
  deleteRecycleItemPermanentFn,
  emptyRecycleBinFn,
} from "@/lib/caso-odin-db.functions";
import type { RecycleItem } from "@/lib/caso-odin-db.server";

interface RecycleBinModalProps {
  currentCaseId: string;
  isOpen: boolean;
  onClose: () => void;
  onItemRestored: () => void;
}

export function RecycleBinModal({
  currentCaseId,
  isOpen,
  onClose,
  onItemRestored,
}: RecycleBinModalProps) {
  const [items, setItems] = useState<RecycleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isEmptying, setIsEmptying] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await loadRecycleBinFn({ data: { caseId: currentCaseId } });
      setItems(res.items || []);
    } catch (err) {
      console.error("Error loading recycle bin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, currentCaseId]);

  if (!isOpen) return null;

  const handleRestore = async (item: RecycleItem) => {
    setActionLoadingId(item.id);
    try {
      const res = await restoreRecycleItemFn({ data: { recycleId: item.id } });
      if (res.restored) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        onItemRestored();
      } else {
        window.alert("No se pudo restaurar el elemento.");
      }
    } catch (err) {
      console.error("Error restoring item:", err);
      window.alert("Ocurrió un error al restaurar.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePermanent = async (item: RecycleItem) => {
    if (!window.confirm("¿Eliminar este elemento permanentemente de la papelera? Esta acción no se puede deshacer.")) {
      return;
    }
    setActionLoadingId(item.id);
    try {
      const res = await deleteRecycleItemPermanentFn({ data: { recycleId: item.id } });
      if (res.deleted) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (err) {
      console.error("Error deleting permanent item:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEmpty = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas vaciar toda la papelera de reciclaje de este caso? Se borrará definitivamente.",
      )
    ) {
      return;
    }
    setIsEmptying(true);
    try {
      const res = await emptyRecycleBinFn({ data: { caseId: currentCaseId } });
      if (res.cleared) {
        setItems([]);
      }
    } catch (err) {
      console.error("Error emptying recycle bin:", err);
    } finally {
      setIsEmptying(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === "todos") return true;
    return item.tabla_origen === filter;
  });

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case "acusaciones":
        return { label: "Acusación", icon: AlertCircle, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
      case "pruebas":
        return { label: "Foja / Prueba", icon: FileText, color: "text-rose border-rose/30 bg-rose/10" };
      case "gestiones":
        return { label: "Gestión", icon: CheckSquare, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" };
      case "implicados":
        return { label: "Implicado", icon: UserX, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" };
      case "casos":
        return { label: "Caso completo", icon: Briefcase, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" };
      default:
        return { label: origin, icon: Trash2, color: "text-dust border-dust/30 bg-dust/10" };
    }
  };

  const getItemTitle = (item: RecycleItem) => {
    const d = item.datos_borrados || {};
    if (item.tabla_origen === "acusaciones") {
      return `${d.numero || "Acusación"} — ${d.titulo || "Sin título"}`;
    }
    if (item.tabla_origen === "pruebas") {
      return d.etiqueta || "Foja sin etiqueta";
    }
    if (item.tabla_origen === "gestiones") {
      return d.descripcion || "Gestión pendiente";
    }
    if (item.tabla_origen === "implicados") {
      return `${d.nombre || "Implicado"} (${d.rol || "Sin rol"})`;
    }
    if (item.tabla_origen === "casos") {
      return d.caso?.nombre || "Expediente de Caso";
    }
    return "Elemento borrado";
  };

  const formatDate = (iso: string) => {
    if (!iso) return "Fecha no registrada";
    try {
      const date = new Date(iso);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-wine-soft/60 bg-[linear-gradient(175deg,oklch(0.09_0.02_18),oklch(0.05_0.01_17))] p-6 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-wine-soft/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose/40 bg-rose/10 text-rose shadow-inner">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-wide text-parchment">
                Papelera de Reciclaje
              </h2>
              <p className="text-[11px] text-dust">
                Historial de acusaciones, fojas y elementos eliminados de este caso. Puedes restaurarlos en cualquier momento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-dust transition-colors hover:bg-wine/30 hover:text-parchment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de Filtros y Estadísticas */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "todos", label: "Todos" },
              { id: "acusaciones", label: "Acusaciones" },
              { id: "pruebas", label: "Fojas" },
              { id: "gestiones", label: "Gestiones" },
              { id: "implicados", label: "Implicados" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                  filter === f.id
                    ? "border border-rose bg-wine/30 font-semibold text-parchment"
                    : "border border-wine-soft/30 bg-ink/60 text-dust hover:text-parchment"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-dust">
            <span>
              Total: <strong className="text-parchment">{items.length}</strong> elementos en papelera
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleEmpty}
                disabled={isEmptying}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose/80 hover:text-rose hover:underline disabled:opacity-50"
              >
                {isEmptying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                Vaciar papelera
              </button>
            )}
          </div>
        </div>

        {/* Lista de Elementos */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-dust">
              <Loader2 className="h-6 w-6 animate-spin text-rose" />
              <span className="text-xs uppercase tracking-wider">Cargando papelera...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-wine-soft/30 bg-ink/30 text-dust">
              <Sparkles className="h-6 w-6 text-dust/60" />
              <p className="text-xs font-semibold uppercase tracking-wider text-parchment/80">
                La papelera está vacía
              </p>
              <p className="text-[11px] text-dust">
                Cualquier acusación o foja que borres aparecerá aquí respaldada automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const badge = getOriginLabel(item.tabla_origen);
                const IconComponent = badge.icon;
                const isItemBusy = actionLoadingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-3 rounded-lg border border-wine-soft/40 bg-ink/60 p-3.5 transition-all hover:border-wine-soft/80 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex items-center gap-1 rounded border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ${badge.color}`}
                      >
                        <IconComponent className="h-3 w-3" />
                        <span>{badge.label}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-parchment">{getItemTitle(item)}</h4>
                        <div className="mt-1 flex items-center gap-2 text-[10.5px] text-dust">
                          <Clock className="h-3 w-3 text-rose/70" />
                          <span>Borrado el {formatDate(item.borrado_en)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleRestore(item)}
                        disabled={isItemBusy}
                        title="Restaurar este elemento al tablero"
                        className="flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-950/40 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-800/60 hover:text-white disabled:opacity-50"
                      >
                        {isItemBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        <span>Restaurar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePermanent(item)}
                        disabled={isItemBusy}
                        title="Eliminar permanentemente de la papelera"
                        className="flex items-center gap-1 rounded border border-rose/40 bg-rose/10 px-2 py-1.5 text-[10.5px] text-rose transition-colors hover:bg-rose hover:text-parchment disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="mt-5 flex items-center justify-between border-t border-wine-soft/40 pt-3">
          <span className="text-[10px] text-dust">
            * Los elementos restaurados regresan de inmediato a su respectivo implicado y tablero.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-parchment/25 px-4 py-1.5 text-xs uppercase tracking-wider text-dust transition-colors hover:bg-wine/30 hover:text-parchment"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
