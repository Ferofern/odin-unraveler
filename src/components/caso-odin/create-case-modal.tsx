import { useState, useEffect } from "react";
import { FolderPlus, X, Palette, Users, Check, Search, ShieldCheck } from "lucide-react";
import { loadAllImplicadosGlobalFn } from "@/lib/caso-odin-db.functions";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (data: {
    nombre: string;
    tipo_penal: string;
    fecha_creacion: string;
    estilo: "penal" | "civil" | "familiar";
    importPeople: { personId: string; includeDetails: boolean }[];
  }) => Promise<void>;
}

export function CreateCaseModal({ isOpen, onClose, onCreateCase }: CreateCaseModalProps) {
  const [nombre, setNombre] = useState("");
  const [tipoPenal, setTipoPenal] = useState("Penal");
  const [fechaCreacion, setFechaCreacion] = useState<string>(
    () => new Date().toISOString().split("T")[0] ?? ""
  );
  const [estilo, setEstilo] = useState<"penal" | "civil" | "familiar">("penal");
  const [globalPeople, setGlobalPeople] = useState<any[]>([]);
  const [searchPerson, setSearchPerson] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<
    Record<string, { selected: boolean; includeDetails: boolean }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setNombre("");
      setTipoPenal("Penal");
      setEstilo("penal");
      setSelectedPeople({});
      setErrorMsg(null);
      return;
    }

    (async () => {
      try {
        const res = await loadAllImplicadosGlobalFn();
        setGlobalPeople(res.people || []);
      } catch (err) {
        console.error("Error loading people in create case:", err);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPeople = globalPeople.filter((p) => {
    const q = searchPerson.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.cedula?.includes(q);
  });

  const toggleSelectPerson = (personId: string) => {
    setSelectedPeople((prev) => {
      const current = prev[personId];
      if (current?.selected) {
        const updated = { ...prev };
        delete updated[personId];
        return updated;
      } else {
        return {
          ...prev,
          [personId]: { selected: true, includeDetails: true },
        };
      }
    });
  };

  const toggleIncludeDetails = (personId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPeople((prev) => {
      const current = prev[personId];
      if (!current) return prev;
      return {
        ...prev,
        [personId]: {
          selected: current.selected,
          includeDetails: !current.includeDetails,
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg("Por favor ingrese el nombre del caso.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const importList = Object.entries(selectedPeople)
      .filter(([_, val]) => val.selected)
      .map(([personId, val]) => ({
        personId,
        includeDetails: val.includeDetails,
      }));

    try {
      await onCreateCase({
        nombre: nombre.trim(),
        tipo_penal: tipoPenal,
        fecha_creacion: fechaCreacion,
        estilo,
        importPeople: importList,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al crear el caso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-wine-soft/60 bg-[linear-gradient(175deg,oklch(0.09_0.02_18),oklch(0.05_0.01_17))] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-wine-soft/40 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="h-5 w-5 text-rose" />
            <h3 className="font-display text-lg font-bold text-parchment">
              Crear Nuevo Expediente / Caso
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-dust hover:bg-wine/30 hover:text-parchment"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6 text-xs text-dust">
          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-2.5 text-center text-xs font-semibold text-rose">
              {errorMsg}
            </div>
          )}

          {/* Información Básica */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
                Nombre Del Caso *
              </label>
              <input
                type="text"
                required
                placeholder="Ejemplo: Caso Concesión Vial, Caso Metástasis..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 w-full rounded border border-wine-soft/50 bg-ink px-3 py-2 text-sm text-parchment focus:border-rose focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
                Tipo Penal / Materia
              </label>
              <select
                value={tipoPenal}
                onChange={(e) => {
                  const val = e.target.value;
                  setTipoPenal(val);
                  // Ajustar estilo por defecto según materia
                  if (val === "Civil") setEstilo("civil");
                  else if (val === "Familiar") setEstilo("familiar");
                  else if (val === "Penal") setEstilo("penal");
                }}
                className="mt-1 w-full rounded border border-wine-soft/50 bg-ink px-3 py-2 text-xs text-parchment focus:border-rose focus:outline-none"
              >
                <option value="Penal">Penal (Lavado de activos, cohecho, etc.)</option>
                <option value="Civil">Civil (Contratos, cobro de pagarés, etc.)</option>
                <option value="Familiar">Familiar (Alimentos, tenencia, sucesiones)</option>
                <option value="Mercantil">Mercantil / Societario</option>
                <option value="Laboral">Laboral</option>
                <option value="Constitucional">Constitucional</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
                Fecha de Creación
              </label>
              <input
                type="date"
                value={fechaCreacion}
                onChange={(e) => setFechaCreacion(e.target.value)}
                className="mt-1 w-full rounded border border-wine-soft/50 bg-ink px-3 py-2 text-xs text-parchment focus:border-rose focus:outline-none"
              />
            </div>
          </div>

          {/* Selector de Estilo del Tablero */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-parchment">
              <Palette className="h-3.5 w-3.5 text-rose" />
              <span>Estilo Visual del Tablero (Paleta Cromática)</span>
            </div>
            <p className="mt-0.5 text-[11px] text-dust">
              Mantiene exactamente la misma estructura funcional; los colores y acabados cambian de forma armónica.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Estilo 1: Penal */}
              <div
                onClick={() => setEstilo("penal")}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                  estilo === "penal"
                    ? "border-rose bg-wine/30 ring-1 ring-rose"
                    : "border-wine-soft/40 bg-ink/60 hover:border-parchment/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-parchment">Penal (Noir)</span>
                  {estilo === "penal" && <Check className="h-4 w-4 text-rose" />}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.35_0.12_18)]" />
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.42_0.15_18)]" />
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.05_0.01_17)] border border-white/20" />
                </div>
                <p className="mt-2 text-[10px] text-dust">
                  Borgoña profundo y tinta negra. Ideal para expedientes penales y fiscales.
                </p>
              </div>

              {/* Estilo 2: Civil */}
              <div
                onClick={() => setEstilo("civil")}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                  estilo === "civil"
                    ? "border-cyan-400 bg-[oklch(0.38_0.12_245/0.25)] ring-1 ring-cyan-400"
                    : "border-wine-soft/40 bg-ink/60 hover:border-parchment/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-parchment">Civil (Medianoche)</span>
                  {estilo === "civil" && <Check className="h-4 w-4 text-cyan-400" />}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.38_0.12_245)]" />
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.46_0.14_245)]" />
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.06_0.02_245)] border border-white/20" />
                </div>
                <p className="mt-2 text-[10px] text-dust">
                  Azul marino pizarra táctico con destellos plata. Ideal para litigio civil y corporativo.
                </p>
              </div>

              {/* Estilo 3: Familiar */}
              <div
                onClick={() => setEstilo("familiar")}
                className={`cursor-pointer rounded-lg border p-3 transition-all ${
                  estilo === "familiar"
                    ? "border-emerald-400 bg-[oklch(0.36_0.10_165/0.25)] ring-1 ring-emerald-400"
                    : "border-wine-soft/40 bg-ink/60 hover:border-parchment/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-parchment">Familiar (Esmeralda)</span>
                  {estilo === "familiar" && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.36_0.10_165)]" />
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.46_0.12_165)]" />
                  <span className="h-4 w-4 rounded-full bg-[oklch(0.06_0.02_165)] border border-white/20" />
                </div>
                <p className="mt-2 text-[10px] text-dust">
                  Verde bosque sereno y ámbar suave. Ideal para derecho familiar, laboral y sucesorio.
                </p>
              </div>
            </div>
          </div>

          {/* Importar implicados de la BD */}
          <div className="border-t border-wine-soft/30 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-parchment">
                <Users className="h-3.5 w-3.5 text-rose" />
                <span>Importar Implicados / Clientes de la BD (Opcional)</span>
              </div>
              <span className="text-[10px] text-dust">
                {Object.values(selectedPeople).filter((p) => p.selected).length} seleccionado(s)
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-dust">
              Puedes seleccionar clientes ya existentes para agregarlos a este caso desde el inicio.
            </p>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-dust" />
              <input
                type="text"
                placeholder="Filtrar por nombre o cédula..."
                value={searchPerson}
                onChange={(e) => setSearchPerson(e.target.value)}
                className="w-full rounded border border-wine-soft/50 bg-ink py-1.5 pl-8 pr-3 text-xs text-parchment focus:border-rose focus:outline-none"
              />
            </div>

            <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {filteredPeople.length === 0 ? (
                <div className="py-4 text-center text-xs text-dust">
                  No hay implicados registrados aún en la base de datos. Podrás añadirlos después en el tablero.
                </div>
              ) : (
                filteredPeople.map((person) => {
                  const state = selectedPeople[person.id];
                  const isChecked = !!state?.selected;
                  const includeDetails = state?.includeDetails ?? true;

                  return (
                    <div
                      key={person.id}
                      onClick={() => toggleSelectPerson(person.id)}
                      className={`flex cursor-pointer items-center justify-between rounded border p-2 text-xs transition-colors ${
                        isChecked
                          ? "border-rose/70 bg-wine/30"
                          : "border-wine-soft/30 bg-ink/50 hover:border-parchment/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded accent-rose"
                        />
                        <div>
                          <span className="font-semibold text-parchment">{person.name}</span>
                          {person.cedula ? (
                            <span className="ml-2 font-mono text-[10px] text-rose">
                              C.I. {person.cedula}
                            </span>
                          ) : null}
                          <span className="ml-2 text-[10px] text-dust">({person.role})</span>
                        </div>
                      </div>

                      {isChecked && (
                        <button
                          type="button"
                          onClick={(e) => toggleIncludeDetails(person.id, e)}
                          className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
                            includeDetails
                              ? "bg-rose text-parchment"
                              : "border border-wine-soft text-dust hover:text-parchment"
                          }`}
                        >
                          {includeDetails ? "Con acusaciones" : "En blanco"}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-wine-soft/40 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-wine-soft/40 px-4 py-2 text-xs uppercase tracking-wider text-dust hover:text-parchment"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nombre.trim()}
              className="flex items-center gap-2 rounded bg-rose px-6 py-2 text-xs font-semibold uppercase tracking-wider text-parchment transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <FolderPlus className="h-4 w-4" />
              {isSubmitting ? "Creando..." : "Crear Expediente y Abrir Tablero"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
