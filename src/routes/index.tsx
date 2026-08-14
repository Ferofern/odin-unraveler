import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Editable } from "@/components/caso-odin/editable";
import { PersonNode } from "@/components/caso-odin/person-node";
import { CaseDetail } from "@/components/caso-odin/case-detail";
import { useCaseState } from "@/lib/caso-odin-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caso Odín — Mapa Judicial de Lavado de Activos" },
      {
        name: "description",
        content:
          "Presentación interactiva del expediente Caso Odín: implicados, acusaciones, pruebas y gestiones pendientes.",
      },
      { property: "og:title", content: "Caso Odín — Mapa Judicial" },
      {
        property: "og:description",
        content: "Expediente interactivo de lavado de activos, Art. 317.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CasoOdinPage,
});

function CasoOdinPage() {
  const {
    state,
    hydrated,
    update,
    updatePerson,
    updateCharge,
    addCharge,
    removeCharge,
    moveCharge,
    addPerson,
    reset,
  } = useCaseState();

  const stageRef = useRef<HTMLDivElement>(null);
  const [openPersonId, setOpenPersonId] = useState<string | null>(null);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);

  const openPerson = useMemo(
    () => state.people.find((p) => p.id === openPersonId) ?? null,
    [state.people, openPersonId],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (e.key === "Escape" && !el?.isContentEditable) {
        setOpenPersonId(null);
        setSelectedChargeId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const watermark = useMemo(() => "EXPEDIENTE: CASO ODÍN - ART. 317   ".repeat(160), []);

  return (
    <main className="font-body relative h-screen overflow-hidden bg-background text-foreground">
      <div className="grid-odin pointer-events-none fixed inset-0 z-0" />
      <div
        aria-hidden
        className="font-display pointer-events-none fixed -inset-[20%] z-0 whitespace-pre-wrap break-words text-[26px] uppercase leading-[5.2] tracking-[0.28em] text-white opacity-[0.028] [transform:rotate(-24deg)]"
      >
        {watermark}
      </div>
      <div className="vignette-odin pointer-events-none fixed inset-0 z-[1]" />

      <header className="fixed inset-x-0 top-0 z-[5] flex items-end justify-between gap-5 border-b border-wine-soft/35 bg-[linear-gradient(180deg,oklch(0.05_0.01_17/0.95),transparent)] px-8 py-5">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-[0.34em] text-wine-soft">
            <Editable value={state.kicker} onCommit={(v) => update((p) => ({ ...p, kicker: v }))} />
          </p>
          <h1 className="font-display text-2xl font-bold tracking-wide text-parchment">
            <Editable value={state.title} onCommit={(v) => update((p) => ({ ...p, title: v }))} />
          </h1>
        </div>
        <p className="hidden max-w-[420px] text-right text-[11px] leading-relaxed text-dust md:block">
          <span className="font-semibold text-parchment">Delito general: </span>
          <Editable value={state.charge} onCommit={(v) => update((p) => ({ ...p, charge: v }))} multiline />
        </p>
      </header>

      <div
        ref={stageRef}
        className="absolute inset-0 z-[3]"
        onClick={() => {
          setOpenPersonId(null);
          setSelectedChargeId(null);
        }}
      >
        {hydrated
          ? state.people.map((person) => (
              <PersonNode
                key={person.id}
                person={person}
                active={openPersonId === person.id}
                stageRef={stageRef}
                onSelect={() => {
                  setOpenPersonId(person.id);
                  setSelectedChargeId(person.charges[0]?.id ?? null);
                }}
                onPatch={(patch) => updatePerson(person.id, patch)}
              />
            ))
          : null}
      </div>

      <div className="fixed bottom-4 right-6 z-[30] flex items-center gap-2 rounded-md border border-wine-soft/60 bg-ink/75 px-2.5 py-1.5">
        <button
          type="button"
          title="Restablecer expediente a los datos originales"
          onClick={() => {
            if (window.confirm("¿Restablecer todo el expediente a los datos originales?")) {
              reset();
              setOpenPersonId(null);
              setSelectedChargeId(null);
            }
          }}
          className="flex items-center gap-1.5 px-1 text-[10px] uppercase tracking-[0.2em] text-dust transition-colors hover:text-parchment"
        >
          <RotateCcw className="h-3 w-3" /> Restablecer
        </button>
      </div>

      <p className="fixed inset-x-0 bottom-6 z-[4] text-center text-[10.5px] uppercase tracking-[0.24em] text-dust">
        Clic en un implicado para abrir el expediente · Arrastre el ícono para moverlo · Esquina inferior para
        redimensionar
      </p>

      {openPerson ? (
        <CaseDetail
          person={openPerson}
          selectedChargeId={selectedChargeId}
          onSelectCharge={setSelectedChargeId}
          onPatchCharge={(chargeId, patch) => updateCharge(openPerson.id, chargeId, patch)}
          onAddCharge={() => {
            const created = addCharge(openPerson.id);
            if (created) setSelectedChargeId(created);
          }}
          onRemoveCharge={(chargeId) => {
            if (!window.confirm("¿Eliminar esta acusación?")) return;
            removeCharge(openPerson.id, chargeId);
            if (selectedChargeId === chargeId) setSelectedChargeId(null);
          }}
          onClose={() => {
            setOpenPersonId(null);
            setSelectedChargeId(null);
          }}
        />
      ) : null}
    </main>
  );
}
