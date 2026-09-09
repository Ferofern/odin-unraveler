import { useState } from "react";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { saveCaseToDb } from "../lib/caso-odin-db.functions";

export function GlobalSaveButton() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleSave = async () => {
    setStatus("saving");
    try {
      const raw = window.localStorage.getItem("caso-odin-state-v2");
      if (!raw) {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }
      const res = await saveCaseToDb({ data: { payload: raw } });
      if (res?.configured) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={status === "saving"}
      className="fixed bottom-6 right-6 z-50 flex h-12 items-center gap-2 rounded-full bg-rose px-6 text-xs font-semibold tracking-widest text-parchment shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-70"
    >
      {status === "idle" && (
        <>
          <Save className="h-4 w-4" />
          GUARDAR CAMBIOS
        </>
      )}
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          GUARDANDO...
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-4 w-4" />
          GUARDADO
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4" />
          ERROR AL GUARDAR
        </>
      )}
    </button>
  );
}