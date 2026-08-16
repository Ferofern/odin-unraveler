import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { X, ImagePlus, Trash2 } from "lucide-react";
import { Editable } from "./editable";
import type { StoredPerson } from "@/lib/caso-odin-store";
import { supabase } from "@/lib/supabase";
import { uid } from "@/lib/caso-odin-store";

interface PersonNodeProps {
  person: StoredPerson;
  active: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onPatch: (patch: Partial<StoredPerson>) => void;
  onRemove: () => void;
}

export function PersonNode({ person, active, stageRef, onSelect, onPatch, onRemove }: PersonNodeProps) {
  const dragging = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoW = person.photoW || 200;
  const photoRatio = person.photoRatio || 0.75;

  const startDrag = (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const originX = person.x;
    const originY = person.y;
    dragging.current = false;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragging.current = true;
      const nextX = Math.min(97, Math.max(3, originX + (dx / rect.width) * 100));
      const nextY = Math.min(95, Math.max(8, originY + (dy / rect.height) * 100));
      onPatch({ x: Number(nextX.toFixed(2)), y: Number(nextY.toFixed(2)) });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const originW = person.w;
    const originH = person.h;

    const move = (ev: PointerEvent) => {
      onPatch({
        w: Math.round(Math.min(520, Math.max(150, originW + (ev.clientX - startX)))),
        h: Math.round(Math.min(440, Math.max(120, originH + (ev.clientY - startY)))),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startPhotoResize = (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origin = photoW;

    const move = (ev: PointerEvent) => {
      const delta = Math.max(ev.clientX - startX, (ev.clientY - startY) / photoRatio);
      onPatch({ photoW: Math.round(Math.min(560, Math.max(90, origin + delta))) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const readPhoto = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("El archivo no es una imagen compatible.");
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uid("img")}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos_implicados')
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      window.alert("Error al subir la imagen a la nube.");
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('fotos_implicados')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    const img = new Image();
    img.onload = () => {
      onPatch({
        photo: publicUrl,
        photoRatio: img.naturalWidth ? Number((img.naturalHeight / img.naturalWidth).toFixed(4)) : 0.75,
        photoW: person.photoW || 200,
      });
    };
    img.src = publicUrl;
  };

  return (
    <div
      className="group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
      style={{ left: `${person.x}%`, top: `${person.y}%` }}
      onClick={(e) => {
        e.stopPropagation();
        if (dragging.current) {
          dragging.current = false;
          return;
        }
        onSelect();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        readPhoto(e.dataTransfer.files?.[0]);
      }}
    >
      <div
        onPointerDown={startDrag}
        className={`relative overflow-hidden rounded-md border p-4 text-center transition-shadow cursor-grab active:cursor-grabbing ${
          active
            ? "node-active border-parchment/60"
            : "node-glow border-parchment/25 bg-[linear-gradient(150deg,oklch(0.42_0.15_18),oklch(0.35_0.12_18)_55%,oklch(0.25_0.08_18)_100%)] hover:border-parchment/60"
        }`}
        style={{ width: person.w, height: person.h }}
      >
        <button
          type="button"
          title={person.photo ? "Reemplazar fotografía" : "Cargar fotografía"}
          onClick={(e) => {
            e.stopPropagation();
            fileRef.current?.click();
          }}
          className="absolute right-1.5 top-1.5 z-20 grid h-6 w-6 place-items-center rounded border border-parchment/30 bg-ink/70 text-parchment opacity-0 transition-opacity hover:bg-wine group-hover:opacity-100"
        >
          <ImagePlus className="h-3 w-3" />
        </button>

        <button
          type="button"
          title="Eliminar implicado"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`¿Eliminar a «${person.name}» y todas sus acusaciones?`)) onRemove();
          }}
          className="absolute right-1.5 top-9 z-20 grid h-6 w-6 place-items-center rounded border border-parchment/30 bg-ink/70 text-parchment opacity-0 transition-opacity hover:bg-wine group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 overflow-hidden pointer-events-none">
          <div className="pointer-events-auto">
            <Editable
              value={person.name}
              onCommit={(v) => onPatch({ name: v || person.name })}
              className={`break-words font-semibold uppercase leading-snug tracking-wider text-parchment ${
                person.w >= 340 ? "text-base" : person.w >= 260 ? "text-sm" : "text-xs"
              }`}
              multiline
              dblClickToEdit
            />
          </div>
          <small className="text-[10px] uppercase tracking-[0.18em] text-parchment/70 pointer-events-auto">
            {person.charges.length} {person.charges.length === 1 ? "Acusación" : "Acusaciones"}
          </small>
          <span className="text-[9px] uppercase tracking-[0.24em] text-parchment/45 pointer-events-auto">{person.role}</span>
        </div>

        <div
          title="Redimensionar cuadro"
          onPointerDown={startResize}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 right-0 z-20 h-5 w-5 cursor-nwse-resize border-b-2 border-r-2 border-parchment/40 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>

      {person.photo ? (
        <div
          className="relative rounded-md border border-parchment/25 bg-ink/70 p-1"
          style={{ width: photoW }}
        >
          <img
            src={person.photo}
            alt={`Fotografía de ${person.name}`}
            className="block w-full rounded-sm object-contain"
            style={{ height: Math.round(photoW * photoRatio) }}
            draggable={false}
          />
          <button
            type="button"
            title="Eliminar fotografía"
            onClick={async (e) => {
              e.stopPropagation();
              if (window.confirm("¿Está seguro de que desea eliminar esta fotografía?")) {
                const fileName = person.photo.split('/').pop();
                if (fileName) await supabase.storage.from('fotos_implicados').remove([fileName]);
                onPatch({ photo: "" });
              }
            }}
            className="absolute right-1 top-1 z-20 grid h-6 w-6 place-items-center rounded border border-parchment/30 bg-ink/80 text-parchment opacity-0 transition-opacity hover:bg-wine group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
          <div
            title="Redimensionar fotografía (mantiene proporción)"
            onPointerDown={startPhotoResize}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 right-0 z-20 h-4 w-4 cursor-nwse-resize border-b-2 border-r-2 border-rose/70 opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => readPhoto(e.target.files?.[0])}
      />
    </div>
  );
}