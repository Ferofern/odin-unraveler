import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function readCase(caseId: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, payload: null };

  try {
    // 1. Traer datos asegurando que no haya errores
    const { data: implicados, error: errImp } = await supabase.from('implicados').select('*').order('id');
    const { data: acusaciones, error: errAcu } = await supabase.from('acusaciones').select('*').order('id');
    const { data: pruebas, error: errPru } = await supabase.from('pruebas').select('*');
    const { data: gestiones, error: errGes } = await supabase.from('gestiones').select('*');

    if (errImp || errAcu || errPru || errGes) {
      console.error("Error cargando de Supabase:", errImp || errAcu || errPru || errGes);
      return { configured: true, payload: null };
    }

    // 2. Mapeo seguro con validación de arreglos vacíos
    const people = (implicados || []).map((imp: any, index: number) => {
      // Comparación segura convirtiendo todo a string y limpiando espacios
      const impIdStr = String(imp.id).trim();
      const impCharges = (acusaciones || []).filter((a: any) => String(a.implicado_id).trim() === impIdStr);
      
      return {
        id: impIdStr.startsWith('p') ? impIdStr : `p-${impIdStr}`, // Respeta el ID si ya tiene el prefijo de tu app
        name: imp.nombre || "Nuevo Implicado",
        role: imp.rol || "Rol no definido",
        x: 12.5 + (index * 25), // Distribución inicial en X
        y: 27,
        w: 240,
        h: 190,
        photo: "",
        photoW: 200,
        photoRatio: 0.75,
        charges: impCharges.map((acu: any) => {
          const acuIdStr = String(acu.id).trim();
          const acuProofs = (pruebas || []).filter((p: any) => String(p.acusacion_id).trim() === acuIdStr);
          const acuTasks = (gestiones || []).filter((g: any) => String(g.acusacion_id).trim() === acuIdStr);

          return {
            id: acuIdStr.startsWith('c') ? acuIdStr : `c-${acuIdStr}`,
            n: acu.numero || "Acusación S/N",
            year: acu.fecha || "S/F",
            title: acu.titulo || "Sin título",
            fields: [
              {
                id: `f-just-${acuIdStr}`,
                label: "La justificación",
                type: "text",
                text: acu.justificacion || "",
                items: []
              },
              {
                id: `f-proofs-${acuIdStr}`,
                label: "La prueba (fojas)",
                type: "proofs",
                text: "",
                items: acuProofs.map((p: any) => ({
                  id: String(p.id).startsWith('pr') ? String(p.id) : `pr-${p.id}`,
                  label: p.etiqueta || "Foja sin nombre",
                  url: p.url || ""
                }))
              },
              {
                id: `f-tasks-${acuIdStr}`,
                label: "Gestiones por realizar",
                type: "tasks",
                text: "",
                items: acuTasks.map((t: any) => ({
                  id: String(t.id).startsWith('tk') ? String(t.id) : `tk-${t.id}`,
                  label: t.descripcion || "Gestión pendiente",
                  url: ""
                }))
              },
              {
                id: `f-tipo-${acuIdStr}`,
                label: "Tipo penal",
                type: "text",
                text: acu.tipo_penal || "Lavado de activos — Art. 317 IN. 1 INC. 1. Activos de origen ilícito.",
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
    console.error("Excepción en readCase:", error);
    return { configured: true, payload: null };
  }
}

// ... Mantén tu función writeCase tal cual la teníamos ...
export async function writeCase(caseId: string, payload: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, saved: false };

  try {
    const state = JSON.parse(payload);
    const people = state.people || [];

    const implicadosUpsert = people.map((p: any) => ({
      id: String(p.id).replace('p-', ''), // Limpiamos el prefijo para la BD si lo tiene
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
        
        const cleanAcuId = String(c.id).replace('c-', '');

        acusacionesUpsert.push({
          id: cleanAcuId,
          implicado_id: String(p.id).replace('p-', ''),
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
              id: String(pr.id).replace('pr-', ''),
              acusacion_id: cleanAcuId,
              etiqueta: pr.label,
              url: pr.url
            });
          }
        }

        const tasksField = c.fields.find((f: any) => f.type === "tasks");
        if (tasksField && tasksField.items) {
          for (const tk of tasksField.items) {
            gestionesUpsert.push({
              id: String(tk.id).replace('tk-', ''),
              acusacion_id: cleanAcuId,
              descripcion: tk.label
            });
          }
        }
      }
    }

    if (acusacionesUpsert.length > 0) await supabase.from('acusaciones').upsert(acusacionesUpsert);
    if (pruebasUpsert.length > 0) await supabase.from('pruebas').upsert(pruebasUpsert);
    if (gestionesUpsert.length > 0) await supabase.from('gestiones').upsert(gestionesUpsert);

    return { configured: true, saved: true };
  } catch (error) {
    console.error("Error en writeCase:", error);
    return { configured: true, saved: false };
  }
}