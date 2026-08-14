import { useEffect, useRef, useState } from "react";

interface EditableProps {
  value: string;
  onCommit: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  /** When true, the text is only editable after a double click (single click bubbles up). */
  dblClickToEdit?: boolean;
}

export function Editable({
  value,
  onCommit,
  className = "",
  multiline = false,
  placeholder = "",
  dblClickToEdit = false,
}: EditableProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [editing, setEditing] = useState(false);
  const active = dblClickToEdit ? editing : true;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.textContent !== value) el.textContent = value;
  }, [value, active]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  return (
    <span
      ref={ref}
      contentEditable={active}
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      title={dblClickToEdit ? "Doble clic para editar" : "Clic para editar"}
      onClick={(e) => {
        if (active) e.stopPropagation();
      }}
      onPointerDown={(e) => {
        if (active) e.stopPropagation();
      }}
      onDoubleClick={(e) => {
        if (dblClickToEdit) {
          e.stopPropagation();
          setEditing(true);
        }
      }}
      onBlur={() => {
        setEditing(false);
        onCommit((ref.current?.textContent ?? "").trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !multiline && !e.shiftKey) {
          e.preventDefault();
          ref.current?.blur();
        }
        if (e.key === "Escape") {
          e.stopPropagation();
          ref.current?.blur();
        }
      }}
      className={`inline-block min-w-[2ch] rounded-sm outline-none empty:before:italic empty:before:text-dust/60 empty:before:content-[attr(data-placeholder)] ${
        active
          ? "shadow-[inset_0_-1px_0_oklch(0.65_0.12_10/0.45)] focus:bg-wine/25 focus:shadow-[inset_0_0_0_1px_oklch(0.65_0.12_10/0.8)]"
          : "cursor-pointer"
      } ${className}`}
    />
  );
}
