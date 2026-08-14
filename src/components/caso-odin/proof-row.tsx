import { useEffect, useRef, useState } from "react";
import { X, FileText, Link2, GripVertical } from "lucide-react";
import type { Proof } from "@/lib/caso-odin-store";

export function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "";
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:", "mailto:", "file:"].includes(url.protocol)) return null;
    if (url.protocol.startsWith("http") && !url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

interface ProofRowProps {
  item: Proof;
  icon: "foja" | "task";
  placeholder: string;
  onChange: (patch: Partial<Proof>) => void;
  onRemove: () => void;
  /** Reordering (drag and drop) hooks — order never renames the item. */
  dragging?: boolean;
  onDragStartItem?: () => void;
  onDragEndItem?: () => void;
  onDropItem?: () => void;
  dropActive?: boolean;
}

export function ProofRow({
  item,
  icon,
  placeholder,
  onChange,
  onRemove,
  dragging = false,
  onDragStartItem,
  onDragEndItem,
  onDropItem,
  dropActive = false,
}: ProofRowProps) {

  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [url, setUrl] = useState(item.url);
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setLabel(item.label);
      setUrl(item.url);
      const t = setTimeout(() => labelRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const save = () => {
    const cleanLabel = label.trim();
    if (!cleanLabel) {
      window.alert("El nombre no puede quedar vacío.");
      labelRef.current?.focus();
      return;
    }
    const normalized = normalizeUrl(url);
    if (normalized === null) {
      window.alert("El hipervínculo no es válido. Ejemplo: https://midominio.com/foja.pdf");
      return;
    }
    onChange({ label: cleanLabel, url: normalized });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="rounded border border-rose/50 bg-ink/70 p-3">
        <label className="block text-[9px] uppercase tracking-[0.22em] text-wine-soft">Nombre</label>
        <input
          ref={labelRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              e.stopPropagation();
              setEditing(false);
            }
          }}
          className="mt-1 w-full rounded border border-wine-soft/60 bg-transparent px-2 py-1.5 text-[12.5px] text-parchment outline-none focus:border-rose"
        />
        <label className="mt-3 block text-[9px] uppercase tracking-[0.22em] text-wine-soft">
          Hipervínculo (opcional)
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              e.stopPropagation();
              setEditing(false);
            }
          }}
          className="mt-1 w-full rounded border border-wine-soft/60 bg-transparent px-2 py-1.5 text-[12px] text-parchment outline-none focus:border-rose"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={save}
            className="border border-rose/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose hover:bg-wine hover:text-parchment"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="border border-parchment/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-dust hover:text-parchment"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group/row flex items-start gap-2">
      {icon === "foja" ? (
        <FileText className="mt-0.5 h-3.5 w-3.5 flex-none text-wine-soft" />
      ) : (
        <span className="mt-1.5 h-1.5 w-1.5 flex-none rotate-45 bg-wine-soft" />
      )}
      <span
        role="button"
        tabIndex={0}
        title={item.url ? `Clic: abrir enlace · Doble clic: editar` : "Doble clic para editar"}
        onClick={() => {
          if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") setEditing(true);
        }}
        className={`flex-1 select-none break-words text-[12.5px] leading-relaxed ${
          item.url
            ? "cursor-pointer text-rose underline decoration-rose/50 underline-offset-2 hover:decoration-rose"
            : "cursor-text border-b border-dashed border-parchment/20 text-parchment/85"
        }`}
      >
        {item.label || <span className="italic text-dust">{placeholder}</span>}
        {item.url ? <Link2 className="ml-1 inline h-3 w-3 align-[-1px]" /> : null}
      </span>
      <button
        type="button"
        title="Eliminar"
        onClick={() => {
          if (window.confirm("¿Está seguro de que desea eliminar este elemento?")) onRemove();
        }}
        className="grid h-6 w-6 flex-none place-items-center rounded border border-parchment/25 text-parchment/70 opacity-0 transition-opacity hover:bg-wine hover:text-parchment group-hover/row:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}
