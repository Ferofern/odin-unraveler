import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function readCase(caseId: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, payload: null };

  try {
    const { data: implicados, error: errImp } = await supabase.from('implicados').select('*').order('orden', { ascending: true, nullsFirst: false }).order('id');
    const { data: acusaciones, error: errAcu } = await supabase.from('acusaciones').select('*').order('orden', { ascending: true, nullsFirst: false }).order('id');
    const { data: pruebas, error: errPru } = await supabase.from('pruebas').select('*');
    const { data: gestiones, error: errGes } = await supabase.from('gestiones').select('*');

    if (errImp || errAcu || errPru || errGes) return { configured: true, payload: null };

    const columnsPerRow = 4;
    const xSpacing = 100 / columnsPerRow;

    const people = (implicados || []).map((imp: any, index: number) => {
      const impIdStr = String(imp.id).trim();
      const impCharges = (acusaciones || []).filter((a: any) => String(a.implicado_id).trim() === impIdStr);
      
      const columnIndex = index % columnsPerRow;
      const rowIndex = Math.floor(index / columnsPerRow);

      return {
        id: impIdStr.startsWith('p') ? impIdStr : `p-${impIdStr}`,
        name: imp.nombre || "Nuevo Implicado",
        role: imp.rol || `ACUSADO 0${index + 1}`,
        x: imp.x !== null ? Number(imp.x) : (xSpacing / 2) + (columnIndex * xSpacing),
        y: imp.y !== null ? Number(imp.y) : 27 + (rowIndex * 35),
        w: imp.w !== null ? Number(imp.w) : 240,
        h: imp.h !== null ? Number(imp.h) : 190,
        photo: imp.foto_url || "",
        photoW: imp.foto_w || 200,
        photoRatio: imp.foto_ratio ? Number(imp.foto_ratio) : 0.75,
        charges: impCharges.map((acu: any, acuIdx: number) => {
          const acuIdStr = String(acu.id).trim();
          const acuProofs = (pruebas || []).filter((p: any) => String(p.acusacion_id).trim() === acuIdStr);
          const acuTasks = (gestiones || []).filter((g: any) => String(g.acusacion_id).trim() === acuIdStr);

          return {
            id: acuIdStr.startsWith('c') ? acuIdStr : `c-${acuIdStr}`,
            n: acu.numero || `ACUSACIÓN ${acuIdx + 1}`,
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
    return { configured: true, payload: null };
  }
}

export async function writeCase(caseId: string, payload: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, saved: false };

  try {
    const state = JSON.parse(payload);
    let people = state.people || [];

    const sortedPeople = [...people].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 10) return a.y - b.y;
      return a.x - b.x;
    });

    const implicadosUpsert = sortedPeople.map((p: any, idx: number) => ({
      id: String(p.id).replace('p-', ''),
      nombre: p.name,
      rol: `ACUSADO ${String(idx + 1).padStart(2, '0')}`,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      orden: idx + 1,
      foto_url: p.photo,
      foto_w: p.photoW,
      foto_ratio: p.photoRatio
    }));

    if (implicadosUpsert.length > 0) {
      await supabase.from('implicados').upsert(implicadosUpsert);
    }

    const acusacionesUpsert: any[] = [];
    const pruebasUpsert: any[] = [];
    const gestionesUpsert: any[] = [];

    for (const p of sortedPeople) {
      const pCharges = p.charges || [];
      for (let i = 0; i < pCharges.length; i++) {
        const c = pCharges[i];
        const justField = c.fields.find((f: any) => f.label === "La justificación");
        const tipoField = c.fields.find((f: any) => f.label === "Tipo penal");
        const cleanAcuId = String(c.id).replace('c-', '');

        acusacionesUpsert.push({
          id: cleanAcuId,
          implicado_id: String(p.id).replace('p-', ''),
          numero: `ACUSACIÓN ${i + 1}`,
          orden: i + 1,
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

    const { data: dbImp } = await supabase.from('implicados').select('id');
    const currentImpIds = implicadosUpsert.map(i => i.id);
    const toDelImp = (dbImp || []).filter(row => !currentImpIds.includes(String(row.id))).map(row => row.id);
    if (toDelImp.length > 0) await supabase.from('implicados').delete().in('id', toDelImp);

    const { data: dbAcu } = await supabase.from('acusaciones').select('id');
    const currentAcuIds = acusacionesUpsert.map(a => a.id);
    const toDelAcu = (dbAcu || []).filter(row => !currentAcuIds.includes(String(row.id))).map(row => row.id);
    if (toDelAcu.length > 0) await supabase.from('acusaciones').delete().in('id', toDelAcu);

    const { data: dbPru } = await supabase.from('pruebas').select('id');
    const currentPruIds = pruebasUpsert.map(p => p.id);
    const toDelPru = (dbPru || []).filter(row => !currentPruIds.includes(String(row.id))).map(row => row.id);
    if (toDelPru.length > 0) await supabase.from('pruebas').delete().in('id', toDelPru);

    const { data: dbGes } = await supabase.from('gestiones').select('id');
    const currentGesIds = gestionesUpsert.map(g => g.id);
    const toDelGes = (dbGes || []).filter(row => !currentGesIds.includes(String(row.id))).map(row => row.id);
    if (toDelGes.length > 0) await supabase.from('gestiones').delete().in('id', toDelGes);

    return { configured: true, saved: true };
  } catch (error) {
    return { configured: true, saved: false };
  }
}