import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { X, Move, ImagePlus, Trash2 } from "lucide-react";
import { Editable } from "./editable";
import type { StoredPerson } from "@/lib/caso-odin-store";
import { supabase } from "@/lib/supabase"; // Importamos el cliente
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

  // ... (tus funciones startDrag, startResize, startPhotoResize se mantienen igual) ...
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

  // --- CORRECCIÓN AQUÍ: Integración con Supabase Storage ---
  const readPhoto = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("El archivo no es una imagen compatible.");
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uid("img")}.${fileExt}`;

    // Subir archivo al bucket de Supabase
    const { error: uploadError } = await supabase.storage
      .from('fotos_implicados')
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      window.alert("Error al subir la imagen a la nube.");
      return;
    }

    // Obtener la URL pública
    const { data: publicUrlData } = supabase.storage
      .from('fotos_implicados')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Calcular proporciones y actualizar estado
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
        {/* ... (el resto de tu JSX se mantiene igual) ... */}
        {/* Asegúrate de que el input tenga el onChange apuntando a readPhoto */}
        <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => readPhoto(e.target.files?.[0])}
        />
        {/* ... */}
    </div>
  );
}