import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FolderKanban,
  FolderPlus,
  UserPlus,
  Users,
  Search,
  Calendar,
  Layers,
  Trash2,
  ExternalLink,
  Shield,
  Palette,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building2,
} from "lucide-react";
import { loadCasesList, createCaseInDbFn, deleteCaseFromDbFn, loadAllImplicadosGlobalFn } from "@/lib/caso-odin-db.functions";
import type { CaseSummary } from "@/lib/caso-odin-db.server";
import { CreateCaseModal } from "@/components/caso-odin/create-case-modal";
import { DeleteCaseModal } from "@/components/caso-odin/delete-case-modal";
import { AddGlobalPersonModal } from "@/components/caso-odin/add-global-person-modal";
import { BoardView } from "@/components/caso-odin/board-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestión de Expedientes y Tableros Judiciales" },
      {
        name: "description",
        content:
          "Plataforma jurídica para la gestión de casos, mapas de implicados, acusaciones y pruebas.",
      },
      { property: "og:title", content: "Expedientes y Tableros Judiciales" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MainCasesPage,
});

function MainCasesPage() {
  const [activeCaseId, setActiveCaseId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("caso");
    }
    return null;
  });

  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [globalPeople, setGlobalPeople] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"casos" | "directorio">("casos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<{ id: string; name: string } | null>(null);

  // Cargar lista de casos y directorio global
  const reloadData = async () => {
    setLoading(true);
    try {
      const [casesRes, peopleRes] = await Promise.all([
        loadCasesList(),
        loadAllImplicadosGlobalFn(),
      ]);
      setCases(casesRes.cases || []);
      setGlobalPeople(peopleRes.people || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Sincronizar parámetro de URL al cambiar de caso
  const selectCase = (caseId: string | null) => {
    setActiveCaseId(caseId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (caseId) {
        url.searchParams.set("caso", caseId);
      } else {
        url.searchParams.delete("caso");
      }
      window.history.pushState({}, "", url.toString());
    }
  };

  // Si hay un caso activo seleccionado, renderizamos su tablero
  if (activeCaseId) {
    return (
      <BoardView
        caseId={activeCaseId}
        onBackToCases={() => {
          selectCase(null);
          reloadData();
        }}
      />
    );
  }

  // Filtrado de casos
  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.nombre.toLowerCase().includes(q) ||
      c.tipo_penal.toLowerCase().includes(q);

    if (selectedFilter === "todos") return matchesSearch;
    return matchesSearch && c.tipo_penal.toLowerCase() === selectedFilter.toLowerCase();
  });

  // Filtrado de directorio de clientes
  const filteredPeople = globalPeople.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.cedula?.includes(q) ||
      p.role?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const getStyleBadge = (estilo: string) => {
    if (estilo === "civil") {
      return {
        label: "Civil (Medianoche)",
        color: "bg-cyan-950/70 text-cyan-300 border-cyan-800/60",
        dot: "bg-cyan-400",
      };
    }
    if (estilo === "familiar") {
      return {
        label: "Familiar (Esmeralda)",
        color: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60",
        dot: "bg-emerald-400",
      };
    }
    return {
      label: "Penal (Noir)",
      color: "bg-wine/30 text-rose border-wine-soft/60",
      dot: "bg-rose",
    };
  };

  return (
    <main className="font-body min-h-screen bg-[linear-gradient(180deg,oklch(0.06_0.015_18),oklch(0.04_0.01_17))] text-foreground">
      <div className="grid-odin pointer-events-none fixed inset-0 z-0 opacity-40" />

      {/* Barra Superior / Logo del Estudio */}
      <header className="relative z-10 border-b border-wine-soft/30 bg-ink/70 px-6 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-wine-soft/60 bg-[linear-gradient(135deg,oklch(0.35_0.12_18),oklch(0.18_0.05_18))] text-parchment shadow-md">
              <Building2 className="h-6 w-6 text-rose" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-wine-soft">
                Estudio Jurídico & Litigación
              </p>
              <h1 className="font-display text-2xl font-bold tracking-wide text-parchment">
                Gestión Integral de Expedientes y Tableros
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddPersonOpen(true)}
              className="flex items-center gap-2 rounded border border-wine-soft/60 bg-ink/90 px-3.5 py-2 text-xs uppercase tracking-wider text-dust transition-all hover:border-parchment hover:text-parchment"
            >
              <UserPlus className="h-4 w-4 text-rose" />
              <span>Añadir Implicado</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded bg-rose px-4 py-2 text-xs font-semibold uppercase tracking-wider text-parchment shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Nuevo Caso</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-wine-soft/40 bg-ink/50 p-4 shadow-sm">
            <div className="flex items-center justify-between text-dust">
              <span className="text-[11px] uppercase tracking-wider">Expedientes Activos</span>
              <FolderKanban className="h-4 w-4 text-rose" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-parchment">
              {cases.length}
            </p>
          </div>

          <div className="rounded-lg border border-wine-soft/40 bg-ink/50 p-4 shadow-sm">
            <div className="flex items-center justify-between text-dust">
              <span className="text-[11px] uppercase tracking-wider">Clientes e Implicados</span>
              <Users className="h-4 w-4 text-rose" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-parchment">
              {globalPeople.length}
            </p>
          </div>

          <div className="rounded-lg border border-wine-soft/40 bg-ink/50 p-4 shadow-sm">
            <div className="flex items-center justify-between text-dust">
              <span className="text-[11px] uppercase tracking-wider">Materias Procesales</span>
              <Shield className="h-4 w-4 text-rose" />
            </div>
            <p className="mt-2 text-xs text-dust">
              Penal · Civil · Familiar · Mercantil
            </p>
          </div>
        </div>

        {/* Pestañas de Vista */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-wine-soft/30 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("casos")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === "casos"
                  ? "bg-rose text-parchment"
                  : "border border-wine-soft/40 bg-ink/50 text-dust hover:text-parchment"
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              <span>Casos y Tableros ({cases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("directorio")}
              className={`flex items-center gap-2 rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === "directorio"
                  ? "bg-rose text-parchment"
                  : "border border-wine-soft/40 bg-ink/50 text-dust hover:text-parchment"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Directorio de Clientes ({globalPeople.length})</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
            <input
              type="text"
              placeholder={
                activeTab === "casos"
                  ? "Buscar casos por nombre o tipo..."
                  : "Buscar clientes por nombre, cédula o email..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-3 text-xs text-parchment focus:border-rose focus:outline-none"
            />
          </div>
        </div>

        {/* Filtros de Materia (Solo visible en pestaña de casos) */}
        {activeTab === "casos" && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] uppercase tracking-wider text-dust mr-1">Filtrar por:</span>
            {["todos", "Penal", "Civil", "Familiar"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`rounded px-3 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                  selectedFilter.toLowerCase() === filter.toLowerCase()
                    ? "bg-wine-soft text-parchment font-semibold"
                    : "border border-wine-soft/30 bg-ink/40 text-dust hover:text-parchment"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* Tab 1: Cuadrícula de Casos */}
        {activeTab === "casos" && (
          <div className="mt-6">
            {loading ? (
              <div className="py-20 text-center text-sm text-dust">
                Cargando expedientes...
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="rounded-lg border border-dashed border-wine-soft/50 bg-ink/30 p-12 text-center">
                <FolderKanban className="mx-auto h-12 w-12 text-dust/60" />
                <h3 className="font-display mt-3 text-lg font-semibold text-parchment">
                  No se encontraron expedientes
                </h3>
                <p className="mt-1 text-xs text-dust">
                  {searchQuery
                    ? "Intente con otro término de búsqueda o filtro."
                    : "Comience creando el primer caso judicial con el botón superior."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded bg-rose px-4 py-2 text-xs font-semibold uppercase tracking-wider text-parchment shadow hover:opacity-90"
                >
                  <FolderPlus className="h-4 w-4" /> Crear Nuevo Caso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCases.map((c) => {
                  const styleBadge = getStyleBadge(c.estilo);

                  return (
                    <div
                      key={c.id}
                      className="group relative flex flex-col justify-between rounded-lg border border-wine-soft/50 bg-[linear-gradient(160deg,oklch(0.08_0.02_18),oklch(0.05_0.01_17))] p-5 shadow-lg transition-all hover:border-parchment/60 hover:shadow-2xl"
                    >
                      <div>
                        {/* Cabecera de la Tarjeta */}
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styleBadge.color}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${styleBadge.dot}`} />
                            {c.tipo_penal}
                          </span>

                          <button
                            type="button"
                            title="Eliminar caso"
                            onClick={() => setCaseToDelete({ id: c.id, name: c.nombre })}
                            className="rounded p-1 text-dust opacity-0 transition-opacity hover:bg-wine/40 hover:text-rose group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Título del Caso */}
                        <h3 className="font-display mt-3 text-lg font-bold leading-snug text-parchment">
                          {c.nombre}
                        </h3>

                        {/* Datos del Caso */}
                        <div className="mt-4 space-y-2 border-t border-wine-soft/20 pt-3 text-xs text-dust">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-wine-soft" />
                            <span>Creado el {c.fecha_creacion}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-wine-soft" />
                            <span>
                              {c.implicados_count ?? 0}{" "}
                              {(c.implicados_count ?? 0) === 1
                                ? "implicado en tablero"
                                : "implicados en tablero"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Palette className="h-3.5 w-3.5 text-wine-soft" />
                            <span>Estilo: {styleBadge.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de Entrada al Tablero */}
                      <button
                        type="button"
                        onClick={() => selectCase(c.id)}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded border border-rose/60 bg-wine/30 py-2.5 text-xs font-semibold uppercase tracking-widest text-parchment transition-all hover:bg-rose hover:text-white"
                      >
                        <span>Abrir Tablero</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Directorio Global de Clientes / Implicados */}
        {activeTab === "directorio" && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-dust">
                Directorio unificado de todas las personas registradas en el estudio jurídico. Los clientes pueden asociarse a múltiples casos sin sobreescribir su información.
              </p>
              <button
                type="button"
                onClick={() => setIsAddPersonOpen(true)}
                className="flex items-center gap-1.5 rounded bg-rose px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-parchment"
              >
                <UserPlus className="h-3.5 w-3.5" /> Nuevo Cliente
              </button>
            </div>

            {filteredPeople.length === 0 ? (
              <div className="rounded-lg border border-dashed border-wine-soft/50 bg-ink/30 p-12 text-center text-xs text-dust">
                No hay personas registradas con ese criterio.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPeople.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-lg border border-wine-soft/40 bg-ink/60 p-4 shadow"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        {p.photo ? (
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="h-10 w-10 rounded-full object-cover border border-wine-soft"
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-wine/40 text-sm font-bold text-parchment">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-parchment">{p.name}</h4>
                          <span className="text-[10px] uppercase tracking-wider text-rose">
                            {p.role || "Cliente / Implicado"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-wine-soft/20 pt-2 text-xs text-dust">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3.5 w-3.5 text-wine-soft" />
                          <span className="font-mono text-parchment">
                            {p.cedula ? `C.I. ${p.cedula}` : "Sin cédula"}
                          </span>
                        </div>
                        {p.telefono && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-wine-soft" />
                            <span>{p.telefono}</span>
                          </div>
                        )}
                        {p.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-wine-soft" />
                            <span>{p.email}</span>
                          </div>
                        )}
                        {p.direccion && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 text-wine-soft" />
                            <span className="line-clamp-1">{p.direccion}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-wine-soft/20 pt-2 text-[10px] text-dust">
                      <span>Participa en {p.cases?.length || 1} expediente(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Crear Caso */}
      {isCreateOpen && (
        <CreateCaseModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreateCase={async (data) => {
            const res = await createCaseInDbFn({ data });
            if (res?.caseId) {
              await reloadData();
              selectCase(res.caseId);
            }
          }}
        />
      )}

      {/* Modal: Añadir Persona Globalmente */}
      {isAddPersonOpen && (
        <AddGlobalPersonModal
          isOpen={isAddPersonOpen}
          cases={cases}
          onClose={() => setIsAddPersonOpen(false)}
          onPersonAdded={reloadData}
        />
      )}

      {/* Modal: Borrar Caso */}
      {caseToDelete && (
        <DeleteCaseModal
          caseId={caseToDelete.id}
          caseName={caseToDelete.name}
          isOpen={true}
          onClose={() => setCaseToDelete(null)}
          onConfirmDelete={async (id) => {
            await deleteCaseFromDbFn({ data: { caseId: id } });
            await reloadData();
          }}
        />
      )}
    </main>
  );
}
