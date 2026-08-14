import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function readCase(caseId: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, payload: null };

  try {
    const { data: implicados, error: errImp } = await supabase.from('implicados').select('*').order('id');
    const { data: acusaciones, error: errAcu } = await supabase.from('acusaciones').select('*').order('id');
    const { data: pruebas, error: errPru } = await supabase.from('pruebas').select('*');
    const { data: gestiones, error: errGes } = await supabase.from('gestiones').select('*');

    if (errImp || errAcu || errPru || errGes) throw new Error();

    const people = implicados.map((imp: any, index: number) => {
      const impCharges = acusaciones.filter((a: any) => a.implicado_id === String(imp.id));
      
      return {
        id: String(imp.id),
        name: imp.nombre,
        role: imp.rol,
        x: 12.5 + (index * 25),
        y: 27,
        w: 240,
        h: 190,
        photo: "",
        photoW: 200,
        photoRatio: 0.75,
        charges: impCharges.map((acu: any) => {
          const acuProofs = pruebas.filter((p: any) => p.acusacion_id === String(acu.id));
          const acuTasks = gestiones.filter((g: any) => g.acusacion_id === String(acu.id));

          return {
            id: String(acu.id),
            n: acu.numero,
            year: acu.fecha,
            title: acu.titulo,
            fields: [
              {
                id: `f-just-${acu.id}`,
                label: "La justificación",
                type: "text",
                text: acu.justificacion || "",
                items: []
              },
              {
                id: `f-proofs-${acu.id}`,
                label: "La prueba (fojas)",
                type: "proofs",
                text: "",
                items: acuProofs.map((p: any) => ({
                  id: String(p.id),
                  label: p.etiqueta,
                  url: p.url || ""
                }))
              },
              {
                id: `f-tasks-${acu.id}`,
                label: "Gestiones por realizar",
                type: "tasks",
                text: "",
                items: acuTasks.map((t: any) => ({
                  id: String(t.id),
                  label: t.descripcion,
                  url: ""
                }))
              },
              {
                id: `f-tipo-${acu.id}`,
                label: "Tipo penal",
                type: "text",
                text: acu.tipo_penal || "",
                items: []
              }
            ]
          };
        })
      };
    });

    const caseState = {
      version: 3,
      kicker: "Expediente Reservado · Caso Odín",
      title: "Mapa de Implicados y Acusaciones",
      charge: "Lavado de activos (Art. 317 IN. 1 INC. 1) — activos de origen ilícito.",
      people: people
    };

    return { configured: true, payload: JSON.stringify(caseState) };
  } catch (error) {
    return { configured: true, payload: null };
  }
}

export async function writeCase(caseId: string, payload: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, saved: false };

  try {
    const state = JSON.parse(payload);
    const people = state.people || [];

    const implicadosUpsert = people.map((p: any) => ({
      id: p.id,
      nombre: p.name,
      rol: p.role
    }));

    if (implicadosUpsert.length > 0) {
      await supabase.from('implicados').upsert(implicadosUpsert);
    }

    const acusacionesUpsert: any[] = [];
    const pruebasUpsert: any[] = [];
    const gestionesUpsert: any[] = [];

    for (const p of people) {
      for (const c of p.charges || []) {
        const justField = c.fields.find((f: any) => f.label === "La justificación");
        const tipoField = c.fields.find((f: any) => f.label === "Tipo penal");

        acusacionesUpsert.push({
          id: c.id,
          implicado_id: p.id,
          numero: c.n,
          fecha: c.year,
          titulo: c.title,
          justificacion: justField ? justField.text : "",
          tipo_penal: tipoField ? tipoField.text : ""
        });

        const proofsField = c.fields.find((f: any) => f.type === "proofs");
        if (proofsField && proofsField.items) {
          for (const pr of proofsField.items) {
            pruebasUpsert.push({
              id: pr.id,
              acusacion_id: c.id,
              etiqueta: pr.label,
              url: pr.url
            });
          }
        }

        const tasksField = c.fields.find((f: any) => f.type === "tasks");
        if (tasksField && tasksField.items) {
          for (const tk of tasksField.items) {
            gestionesUpsert.push({
              id: tk.id,
              acusacion_id: c.id,
              descripcion: tk.label
            });
          }
        }
      }
    }

    if (acusacionesUpsert.length > 0) {
      await supabase.from('acusaciones').upsert(acusacionesUpsert);
    }
    if (pruebasUpsert.length > 0) {
      await supabase.from('pruebas').upsert(pruebasUpsert);
    }
    if (gestionesUpsert.length > 0) {
      await supabase.from('gestiones').upsert(gestionesUpsert);
    }

    return { configured: true, saved: true };
  } catch (error) {
    return { configured: true, saved: false };
  }
}