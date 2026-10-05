import { useState, useEffect } from "react";
import { X, UserPlus, Search, UserCheck, CheckCircle2, ShieldAlert } from "lucide-react";
import { loadAllImplicadosGlobalFn, loadCaseFromDb } from "@/lib/caso-odin-db.functions";
import type { StoredPerson } from "@/lib/caso-odin-store";

interface ImportPersonModalProps {
  currentCaseId: string;
  existingPersonIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onImportPerson: (person: StoredPerson, includeDetails: boolean) => void;
}

export function ImportPersonModal({
  currentCaseId,
  existingPersonIds,
  isOpen,
  onClose,
  onImportPerson,
}: ImportPersonModalProps) {
  const [globalPeople, setGlobalPeople] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [fullPersonData, setFullPersonData] = useState<StoredPerson | null>(null);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPerson(null);
      setFullPersonData(null);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const res = await loadAllImplicadosGlobalFn();
        setGlobalPeople(res.people || []);
      } catch (err) {
        console.error("Error loading global people:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  // Cargar datos completos (incluyendo acusaciones) de la persona seleccionada
  useEffect(() => {
    if (!selectedPerson) {
      setFullPersonData(null);
      return;
    }
    (async () => {
      // Buscar en el caso del que proviene
      const sourceCase = selectedPerson.cases?.[0] || "caso-odin";
      try {
        const res = await loadCaseFromDb({ data: { caseId: sourceCase } });
        if (res.payload) {
          const parsed = JSON.parse(res.payload);
          const found = (parsed.people || []).find(
            (p: any) =>
              p.id === selectedPerson.id ||
              (p.cedula && p.cedula === selectedPerson.cedula) ||
              p.name.trim().toLowerCase() === selectedPerson.name.trim().toLowerCase()
          );
          if (found) {
            setFullPersonData(found);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      // Si no tiene acusaciones en caso anterior o no se encuentra:
      setFullPersonData({
        id: selectedPerson.id,
        name: selectedPerson.name,
        role: selectedPerson.role || "Implicado",
        cedula: selectedPerson.cedula || "",
        telefono: selectedPerson.telefono || "",
        direccion: selectedPerson.direccion || "",
        email: selectedPerson.email || "",
        x: 50,
        y: 50,
        w: 240,
        h: 190,
        photo: selectedPerson.photo || "",
        photoW: 200,
        photoRatio: 0.75,
        charges: [],
      });
    })();
  }, [selectedPerson]);

  if (!isOpen) return null;

  const filtered = globalPeople.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.cedula?.includes(term) ||
      p.role?.toLowerCase().includes(term)
    );
  });

  const handleImport = () => {
    if (!fullPersonData) return;
    onImportPerson(fullPersonData, includeDetails);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-xl flex-col rounded-lg border border-wine-soft/60 bg-[linear-gradient(175deg,oklch(0.09_0.02_18),oklch(0.05_0.01_17))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-wine-soft/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-rose" />
            <h3 className="font-display text-lg font-bold text-parchment">
              Importar Implicado / Cliente al Tablero
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-dust hover:bg-wine/30 hover:text-parchment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm text-foreground">
          <p className="text-xs text-dust">
            Selecciona un implicado o cliente existente en la base de datos para agregarlo a este expediente.
            Importarlo <strong className="text-parchment">no lo borra de otros casos</strong>; sus cambios en este tablero quedarán separados.
          </p>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-4 text-xs text-parchment focus:border-rose focus:outline-none"
            />
          </div>

          {/* Lista de Personas */}
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="py-6 text-center text-xs text-dust">
                Cargando directorio de implicados...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-xs text-dust">
                No se encontraron personas con ese criterio.
              </div>
            ) : (
              filtered.map((person) => {
                const isSelected = selectedPerson?.id === person.id;
                return (
                  <div
                    key={person.id}
                    onClick={() => setSelectedPerson(person)}
                    className={`flex cursor-pointer items-center justify-between rounded border p-3 transition-colors ${
                      isSelected
                        ? "border-rose bg-wine/30"
                        : "border-wine-soft/30 bg-ink/50 hover:border-parchment/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {person.photo ? (
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="h-9 w-9 rounded-full object-cover border border-wine-soft"
                        />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-wine/40 text-xs font-bold text-parchment">
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-parchment">{person.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-dust">
                          {person.cedula ? (
                            <span className="font-mono text-rose">C.I. {person.cedula}</span>
                          ) : null}
                          <span>·</span>
                          <span>{person.role || "Implicado"}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-rose" />
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-dust hover:text-parchment">
                        Seleccionar
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Opciones de Importación */}
          {selectedPerson && (
            <div className="rounded border border-wine-soft/40 bg-ink/70 p-4 space-y-3">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-parchment">
                Opciones de importación para {selectedPerson.name}
              </span>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="mt-0.5 rounded accent-rose"
                />
                <div className="text-xs">
                  <span className="font-medium text-parchment">
                    Importar con su información (acusaciones, pruebas y tareas)
                  </span>
                  <p className="text-[11px] text-dust">
                    Si se desmarca, se importará con sus acusaciones en blanco para iniciar desde cero en este caso.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

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
            onClick={handleImport}
            disabled={!selectedPerson}
            className="flex items-center gap-1.5 rounded bg-rose px-5 py-2 text-xs font-semibold uppercase tracking-wider text-parchment transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Importar al Tablero
          </button>
        </div>
      </div>
    </div>
  );
}
