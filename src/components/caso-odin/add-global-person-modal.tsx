import { useState } from "react";
import { UserPlus, X, User, Phone, Mail, MapPin, CreditCard, Briefcase } from "lucide-react";
import { addGlobalImplicadoFn } from "@/lib/caso-odin-db.functions";
import type { CaseSummary } from "@/lib/caso-odin-db.server";

interface AddGlobalPersonModalProps {
  isOpen: boolean;
  cases: CaseSummary[];
  onClose: () => void;
  onPersonAdded: () => void;
}

export function AddGlobalPersonModal({
  isOpen,
  cases,
  onClose,
  onPersonAdded,
}: AddGlobalPersonModalProps) {
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rol, setRol] = useState("Cliente / Implicado");
  const [assignedCaseId, setAssignedCaseId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg("El nombre completo es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await addGlobalImplicadoFn({
        data: {
          nombre: nombre.trim(),
          cedula: cedula.trim() || undefined,
          telefono: telefono.trim() || undefined,
          email: email.trim() || undefined,
          direccion: direccion.trim() || undefined,
          rol: rol.trim() || "Cliente / Implicado",
          caso_id: assignedCaseId || undefined,
        },
      });

      if (res?.configured) {
        onPersonAdded();
        onClose();
      } else {
        setErrorMsg("No se pudo registrar la persona en la base de datos.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error al registrar a la persona.");
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
        className="relative flex w-full max-w-lg flex-col rounded-lg border border-wine-soft/60 bg-[linear-gradient(175deg,oklch(0.09_0.02_18),oklch(0.05_0.01_17))] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-dust hover:bg-wine/30 hover:text-parchment"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-wine/40 border border-wine-soft text-rose">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-parchment">
              Registrar Nuevo Cliente / Implicado
            </h3>
            <p className="text-[11px] text-dust">
              Añade una ficha personal directamente al directorio de la firma jurídica
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs text-dust">
          {errorMsg && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-center text-xs font-semibold text-rose">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
              Nombre Completo *
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
              <input
                type="text"
                required
                placeholder="Nombres y apellidos completos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-3 text-xs text-parchment focus:border-rose focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
                Cédula / Identificación
              </label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
                <input
                  type="text"
                  placeholder="Ej: 0908162373"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-3 font-mono text-xs text-rose focus:border-rose focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
                Rol / Condición
              </label>
              <div className="relative mt-1">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
                <input
                  type="text"
                  placeholder="Ej: Cliente, Investigado, Testigo..."
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-3 text-xs text-parchment focus:border-rose focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
                Teléfono de Contacto (Opcional)
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
                <input
                  type="text"
                  placeholder="Ej: 0991234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-3 text-xs text-parchment focus:border-rose focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
                <input
                  type="email"
                  placeholder="contacto@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-3 text-xs text-parchment focus:border-rose focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
              Dirección Domiciliaria / Procesal (Opcional)
            </label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-dust" />
              <input
                type="text"
                placeholder="Ciudad, calle, edificio o referencia"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full rounded border border-wine-soft/50 bg-ink py-2 pl-9 pr-3 text-xs text-parchment focus:border-rose focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-parchment">
              Asignar a un Caso Inicial (Opcional)
            </label>
            <select
              value={assignedCaseId}
              onChange={(e) => setAssignedCaseId(e.target.value)}
              className="mt-1 w-full rounded border border-wine-soft/50 bg-ink px-3 py-2 text-xs text-parchment focus:border-rose focus:outline-none"
            >
              <option value="">(Sin asignar a ningún caso todavía — cliente general)</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.tipo_penal})
                </option>
              ))}
            </select>
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
              type="submit"
              disabled={isSubmitting || !nombre.trim()}
              className="flex items-center gap-1.5 rounded bg-rose px-5 py-2 text-xs font-semibold uppercase tracking-wider text-parchment transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? "Registrando..." : "Guardar en Directorio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
