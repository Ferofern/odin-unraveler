import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env['VITE_SUPABASE_URL'] || '';
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['VITE_SUPABASE_ANON_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const todayStr = (): string => new Date().toISOString().split('T')[0] ?? '';

export interface CaseSummary {
  id: string;
  nombre: string;
  tipo_penal: string;
  fecha_creacion: string;
  estilo: 'penal' | 'civil' | 'familiar';
  implicados_count?: number;
}

export async function listCases(): Promise<{ configured: boolean; cases: CaseSummary[] }> {
  if (!supabaseUrl || !supabaseKey) {
    return {
      configured: false,
      cases: [
        {
          id: 'caso-odin',
          nombre: 'caso Odin',
          tipo_penal: 'Penal',
          fecha_creacion: todayStr(),
          estilo: 'penal',
          implicados_count: 0,
        },
      ],
    };
  }

  try {
    const { data: casesData, error: casesErr } = await supabase
      .from('casos')
      .select('*')
      .order('fecha_creacion', { ascending: false });

    const { data: impCounts, error: impErr } = await supabase
      .from('implicados')
      .select('id, caso_id');

    let casesList: CaseSummary[] = [];

    if (!casesErr && casesData && casesData.length > 0) {
      casesList = casesData.map((c: any) => {
        const count = (impCounts || []).filter(
          (imp: any) =>
            imp.caso_id === c.id || (c.id === 'caso-odin' && !imp.caso_id)
        ).length;

        return {
          id: String(c.id),
          nombre: c.nombre || 'Caso sin nombre',
          tipo_penal: c.tipo_penal || 'Penal',
          fecha_creacion: c.fecha_creacion || todayStr(),
          estilo: (['penal', 'civil', 'familiar'].includes(c.estilo) ? c.estilo : 'penal') as 'penal' | 'civil' | 'familiar',
          implicados_count: count,
        };
      });
    } else {
      // Fallback si la tabla casos aún no se ha creado o está vacía
      const count = (impCounts || []).length;
      casesList = [
        {
          id: 'caso-odin',
          nombre: 'caso Odin',
          tipo_penal: 'Penal',
          fecha_creacion: todayStr(),
          estilo: 'penal',
          implicados_count: count,
        },
      ];
    }

    return { configured: true, cases: casesList };
  } catch (error) {
    console.error('Error in listCases:', error);
    return {
      configured: true,
      cases: [
        {
          id: 'caso-odin',
          nombre: 'caso Odin',
          tipo_penal: 'Penal',
          fecha_creacion: todayStr(),
          estilo: 'penal',
          implicados_count: 0,
        },
      ],
    };
  }
}

export async function readCase(caseId: string = 'caso-odin') {
  if (!supabaseUrl || !supabaseKey) return { configured: false, payload: null, caseInfo: null };

  try {
    // 1. Obtener metadatos del caso
    const { data: caseRow } = await supabase
      .from('casos')
      .select('*')
      .eq('id', caseId)
      .maybeSingle();

    const caseInfo: CaseSummary = caseRow
      ? {
          id: String(caseRow.id),
          nombre: caseRow.nombre || (caseId === 'caso-odin' ? 'caso Odin' : 'Caso Judicial'),
          tipo_penal: caseRow.tipo_penal || 'Penal',
          fecha_creacion: caseRow.fecha_creacion || todayStr(),
          estilo: (['penal', 'civil', 'familiar'].includes(caseRow.estilo) ? caseRow.estilo : 'penal') as any,
        }
      : {
          id: caseId,
          nombre: caseId === 'caso-odin' ? 'caso Odin' : `Caso ${caseId}`,
          tipo_penal: 'Penal',
          fecha_creacion: todayStr(),
          estilo: 'penal',
        };

    // 2. Obtener implicados correspondientes al caso
    let impQuery = supabase
      .from('implicados')
      .select('*')
      .order('orden', { ascending: true, nullsFirst: false })
      .order('id');

    if (caseId === 'caso-odin') {
      impQuery = impQuery.or(`caso_id.eq.${caseId},caso_id.is.null`);
    } else {
      impQuery = impQuery.eq('caso_id', caseId);
    }

    const { data: implicados, error: errImp } = await impQuery;

    const impIds = (implicados || []).map((imp: any) => String(imp.id).trim());

    // 3. Obtener acusaciones de estos implicados
    let acusaciones: any[] = [];
    let pruebas: any[] = [];
    let gestiones: any[] = [];

    if (impIds.length > 0) {
      const { data: acuData } = await supabase
        .from('acusaciones')
        .select('*')
        .in('implicado_id', impIds)
        .order('orden', { ascending: true, nullsFirst: false })
        .order('id');

      acusaciones = acuData || [];

      const acuIds = acusaciones.map((a: any) => String(a.id).trim());
      if (acuIds.length > 0) {
        const { data: pruData } = await supabase
          .from('pruebas')
          .select('*')
          .in('acusacion_id', acuIds);
        pruebas = pruData || [];

        const { data: gesData } = await supabase
          .from('gestiones')
          .select('*')
          .in('acusacion_id', acuIds);
        gestiones = gesData || [];
      }
    }

    const columnsPerRow = 4;
    const xSpacing = 100 / columnsPerRow;

    const people = (implicados || []).map((imp: any, index: number) => {
      const impIdStr = String(imp.id).trim();
      const impCharges = (acusaciones || []).filter((a: any) => String(a.implicado_id).trim() === impIdStr);

      const columnIndex = index % columnsPerRow;
      const rowIndex = Math.floor(index / columnsPerRow);

      return {
        id: impIdStr.startsWith('p') ? impIdStr : `p-${impIdStr}`,
        name: imp.nombre || 'Nuevo Implicado',
        role: imp.rol || `ACUSADO 0${index + 1}`,
        cedula: imp.cedula || '',
        telefono: imp.telefono || '',
        direccion: imp.direccion || '',
        email: imp.email || '',
        caso_id: imp.caso_id || caseId,
        x: imp.x !== null ? Number(imp.x) : xSpacing / 2 + columnIndex * xSpacing,
        y: imp.y !== null ? Number(imp.y) : 27 + rowIndex * 35,
        w: imp.w !== null ? Number(imp.w) : 240,
        h: imp.h !== null ? Number(imp.h) : 190,
        photo: imp.foto_url || '',
        photoW: imp.foto_w || 200,
        photoRatio: imp.foto_ratio ? Number(imp.foto_ratio) : 0.75,
        charges: impCharges.map((acu: any, acuIdx: number) => {
          const acuIdStr = String(acu.id).trim();
          const acuProofs = (pruebas || []).filter((p: any) => String(p.acusacion_id).trim() === acuIdStr);
          const acuTasks = (gestiones || []).filter((g: any) => String(g.acusacion_id).trim() === acuIdStr);

          return {
            id: acuIdStr.startsWith('c') ? acuIdStr : `c-${acuIdStr}`,
            n: acu.numero || `ACUSACIÓN ${acuIdx + 1}`,
            year: acu.fecha || 'S/F',
            title: acu.titulo || 'Sin título',
            fields: [
              {
                id: `f-just-${acuIdStr}`,
                label: 'La justificación',
                type: 'text',
                text: acu.justificacion || '',
                items: [],
              },
              {
                id: `f-proofs-${acuIdStr}`,
                label: 'La prueba (fojas)',
                type: 'proofs',
                text: '',
                items: acuProofs.map((p: any) => ({
                  id: String(p.id).startsWith('pr') ? String(p.id) : `pr-${p.id}`,
                  label: p.etiqueta || 'Foja sin nombre',
                  url: p.url || '',
                })),
              },
              {
                id: `f-tasks-${acuIdStr}`,
                label: 'Gestiones por realizar',
                type: 'tasks',
                text: '',
                items: acuTasks.map((t: any) => ({
                  id: String(t.id).startsWith('tk') ? String(t.id) : `tk-${t.id}`,
                  label: t.descripcion || 'Gestión pendiente',
                  url: '',
                })),
              },
              {
                id: `f-tipo-${acuIdStr}`,
                label: 'Tipo penal',
                type: 'text',
                text: acu.tipo_penal || 'Lavado de activos — Art. 317 IN. 1 INC. 1. Activos de origen ilícito.',
                items: [],
              },
            ],
          };
        }),
      };
    });

    const caseState = {
      version: 3,
      id: caseId,
      kicker: caseId === 'caso-odin' ? 'Expediente Reservado · Caso Odín' : `Expediente Judicial · ${caseInfo.nombre}`,
      title: caseInfo.nombre || 'Mapa de Implicados y Acusaciones',
      charge: caseInfo.tipo_penal === 'Penal'
        ? 'Lavado de activos (Art. 317 IN. 1 INC. 1) — activos de origen ilícito.'
        : `Materia / Delito: ${caseInfo.tipo_penal}`,
      tipoPenal: caseInfo.tipo_penal,
      estilo: caseInfo.estilo,
      fechaCreacion: caseInfo.fecha_creacion,
      people: people,
    };

    return { configured: true, payload: JSON.stringify(caseState), caseInfo };
  } catch (error) {
    console.error('Error in readCase:', error);
    return { configured: true, payload: null, caseInfo: null };
  }
}

export async function writeCase(caseId: string, payload: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, saved: false };

  try {
    const state = JSON.parse(payload);
    let people = state.people || [];

    // 1. Asegurar o actualizar caso en tabla casos
    await supabase.from('casos').upsert({
      id: caseId,
      nombre: state.title || (caseId === 'caso-odin' ? 'caso Odin' : `Caso ${caseId}`),
      tipo_penal: state.tipoPenal || 'Penal',
      estilo: state.estilo || 'penal',
    });

    const sortedPeople = [...people].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 10) return a.y - b.y;
      return a.x - b.x;
    });

    // 2. Upsert implicados con caso_id asignado a este tablero
    const implicadosUpsert = sortedPeople.map((p: any, idx: number) => ({
      id: String(p.id).replace('p-', ''),
      caso_id: caseId,
      nombre: p.name,
      rol: p.role || `ACUSADO ${String(idx + 1).padStart(2, '0')}`,
      cedula: p.cedula || null,
      telefono: p.telefono || null,
      direccion: p.direccion || null,
      email: p.email || null,
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      orden: idx + 1,
      foto_url: p.photo,
      foto_w: p.photoW,
      foto_ratio: p.photoRatio,
    }));

    if (implicadosUpsert.length > 0) {
      await supabase.from('implicados').upsert(implicadosUpsert);
    }

    const acusacionesUpsert: any[] = [];
    const pruebasUpsert: any[] = [];
    const gestionesUpsert: any[] = [];

    for (const p of sortedPeople) {
      const pCharges = p.charges || [];
      const personDbId = String(p.id).replace('p-', '');

      for (let i = 0; i < pCharges.length; i++) {
        const c = pCharges[i];
        const justField = c.fields?.find((f: any) => f.label === 'La justificación');
        const tipoField = c.fields?.find((f: any) => f.label === 'Tipo penal');
        const cleanAcuId = String(c.id).replace('c-', '');

        acusacionesUpsert.push({
          id: cleanAcuId,
          implicado_id: personDbId,
          numero: c.n || `ACUSACIÓN ${i + 1}`,
          orden: i + 1,
          fecha: c.year,
          titulo: c.title,
          justificacion: justField ? justField.text : '',
          tipo_penal: tipoField ? tipoField.text : '',
        });

        const proofsField = c.fields?.find((f: any) => f.type === 'proofs');
        if (proofsField && proofsField.items) {
          for (const pr of proofsField.items) {
            pruebasUpsert.push({
              id: String(pr.id).replace('pr-', ''),
              acusacion_id: cleanAcuId,
              etiqueta: pr.label,
              url: pr.url,
            });
          }
        }

        const tasksField = c.fields?.find((f: any) => f.type === 'tasks');
        if (tasksField && tasksField.items) {
          for (const tk of tasksField.items) {
            gestionesUpsert.push({
              id: String(tk.id).replace('tk-', ''),
              acusacion_id: cleanAcuId,
              descripcion: tk.label,
            });
          }
        }
      }
    }

    if (acusacionesUpsert.length > 0) await supabase.from('acusaciones').upsert(acusacionesUpsert);
    if (pruebasUpsert.length > 0) await supabase.from('pruebas').upsert(pruebasUpsert);
    if (gestionesUpsert.length > 0) await supabase.from('gestiones').upsert(gestionesUpsert);

    // 3. Limpieza SEGURA: SÓLO eliminar registros que pertenecían a ESTE CASO y fueron retirados
    const { data: dbImpForCase } = await supabase
      .from('implicados')
      .select('id')
      .eq('caso_id', caseId);

    const currentImpIds = implicadosUpsert.map((i) => i.id);
    const toDelImp = (dbImpForCase || [])
      .filter((row: any) => !currentImpIds.includes(String(row.id)))
      .map((row: any) => row.id);

    if (toDelImp.length > 0) {
      await supabase.from('implicados').delete().in('id', toDelImp);
    }

    return { configured: true, saved: true };
  } catch (error) {
    console.error('Error in writeCase:', error);
    return { configured: true, saved: false };
  }
}

export async function createCaseInDb(caseData: {
  id?: string | undefined;
  nombre: string;
  tipo_penal: string;
  fecha_creacion?: string | undefined;
  estilo: 'penal' | 'civil' | 'familiar';
  importPeople?: { personId: string; includeDetails: boolean }[] | undefined;
}) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, caseId: null };

  try {
    const caseId =
      caseData.id ||
      `caso-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fecha = caseData.fecha_creacion || todayStr();

    const { error: insertErr } = await supabase.from('casos').insert({
      id: caseId,
      nombre: caseData.nombre,
      tipo_penal: caseData.tipo_penal || 'Penal',
      fecha_creacion: fecha,
      estilo: caseData.estilo || 'penal',
    });

    if (insertErr) {
      console.error('Error inserting case:', insertErr);
    }

    // Importar implicados seleccionados al nuevo caso
    if (caseData.importPeople && caseData.importPeople.length > 0) {
      for (const item of caseData.importPeople) {
        const cleanSrcId = item.personId.replace('p-', '');
        const { data: srcPerson } = await supabase
          .from('implicados')
          .select('*')
          .eq('id', cleanSrcId)
          .maybeSingle();

        if (srcPerson) {
          const newPersonId = `imp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
          await supabase.from('implicados').insert({
            id: newPersonId,
            caso_id: caseId,
            nombre: srcPerson.nombre,
            rol: srcPerson.rol,
            cedula: srcPerson.cedula,
            telefono: srcPerson.telefono,
            direccion: srcPerson.direccion,
            email: srcPerson.email,
            foto_url: srcPerson.foto_url,
            foto_w: srcPerson.foto_w,
            foto_ratio: srcPerson.foto_ratio,
            x: srcPerson.x,
            y: srcPerson.y,
            w: srcPerson.w,
            h: srcPerson.h,
            orden: srcPerson.orden,
          });

          // Si seleccionó importar con su información (acusaciones, pruebas, gestiones)
          if (item.includeDetails) {
            const { data: srcAcu } = await supabase
              .from('acusaciones')
              .select('*')
              .eq('implicado_id', cleanSrcId);

            if (srcAcu && srcAcu.length > 0) {
              for (const acu of srcAcu) {
                const newAcuId = `acu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
                await supabase.from('acusaciones').insert({
                  id: newAcuId,
                  implicado_id: newPersonId,
                  numero: acu.numero,
                  fecha: acu.fecha,
                  titulo: acu.titulo,
                  justificacion: acu.justificacion,
                  tipo_penal: acu.tipo_penal,
                  orden: acu.orden,
                });

                // Copiar pruebas
                const { data: srcPru } = await supabase
                  .from('pruebas')
                  .select('*')
                  .eq('acusacion_id', acu.id);
                if (srcPru && srcPru.length > 0) {
                  const newProofs = srcPru.map((pr: any) => ({
                    id: `pru-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                    acusacion_id: newAcuId,
                    etiqueta: pr.etiqueta,
                    url: pr.url,
                  }));
                  await supabase.from('pruebas').insert(newProofs);
                }

                // Copiar gestiones
                const { data: srcGes } = await supabase
                  .from('gestiones')
                  .select('*')
                  .eq('acusacion_id', acu.id);
                if (srcGes && srcGes.length > 0) {
                  const newTasks = srcGes.map((tk: any) => ({
                    id: `ges-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
                    acusacion_id: newAcuId,
                    descripcion: tk.descripcion,
                  }));
                  await supabase.from('gestiones').insert(newTasks);
                }
              }
            }
          }
        }
      }
    }

    return { configured: true, caseId };
  } catch (error) {
    console.error('Error in createCaseInDb:', error);
    return { configured: true, caseId: null };
  }
}

export async function deleteCaseFromDb(caseId: string) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, deleted: false };

  try {
    // 1. Obtener toda la información del caso para moverla a papelera_reciclaje
    const { data: caseRow } = await supabase.from('casos').select('*').eq('id', caseId).maybeSingle();
    const { data: impRows } = await supabase.from('implicados').select('*').eq('caso_id', caseId);

    const impIds = (impRows || []).map((i: any) => i.id);
    let acuRows: any[] = [];
    let pruRows: any[] = [];
    let gesRows: any[] = [];

    if (impIds.length > 0) {
      const { data: acs } = await supabase.from('acusaciones').select('*').in('implicado_id', impIds);
      acuRows = acs || [];
      const acuIds = acuRows.map((a: any) => a.id);
      if (acuIds.length > 0) {
        const { data: prs } = await supabase.from('pruebas').select('*').in('acusacion_id', acuIds);
        pruRows = prs || [];
        const { data: gts } = await supabase.from('gestiones').select('*').in('acusacion_id', acuIds);
        gesRows = gts || [];
      }
    }

    const fullSnapshot = {
      caso: caseRow || { id: caseId },
      implicados: impRows || [],
      acusaciones: acuRows,
      pruebas: pruRows,
      gestiones: gesRows,
      deleted_at: new Date().toISOString(),
    };

    // 2. Insertar en papelera_reciclaje
    await supabase.from('papelera_reciclaje').insert({
      tabla_origen: 'casos',
      datos_borrados: fullSnapshot,
    });

    // 3. Eliminar de las tablas activas
    if (impIds.length > 0) {
      await supabase.from('implicados').delete().in('id', impIds);
    }
    await supabase.from('casos').delete().eq('id', caseId);

    return { configured: true, deleted: true };
  } catch (error) {
    console.error('Error in deleteCaseFromDb:', error);
    return { configured: true, deleted: false };
  }
}

export async function updateCaseStyleInDb(caseId: string, estilo: 'penal' | 'civil' | 'familiar') {
  if (!supabaseUrl || !supabaseKey) return { configured: false, updated: false };
  try {
    await supabase.from('casos').update({ estilo }).eq('id', caseId);
    return { configured: true, updated: true };
  } catch (error) {
    console.error('Error in updateCaseStyleInDb:', error);
    return { configured: true, updated: false };
  }
}

export async function listAllImplicadosGlobal() {
  if (!supabaseUrl || !supabaseKey) return { configured: false, people: [] };

  try {
    const { data: allImps, error } = await supabase
      .from('implicados')
      .select('*')
      .order('nombre');

    if (error || !allImps) return { configured: true, people: [] };

    // Agrupar o listar clientes únicos por cédula/nombre
    const map = new Map<string, any>();
    for (const imp of allImps) {
      const key = (imp.cedula && imp.cedula.trim()) || (imp.nombre && imp.nombre.trim().toLowerCase()) || imp.id;
      if (!map.has(key)) {
        map.set(key, {
          id: String(imp.id),
          name: imp.nombre || 'Sin nombre',
          cedula: imp.cedula || '',
          telefono: imp.telefono || '',
          direccion: imp.direccion || '',
          email: imp.email || '',
          role: imp.rol || 'Implicado / Cliente',
          photo: imp.foto_url || '',
          cases: [imp.caso_id || 'caso-odin'],
        });
      } else {
        const existing = map.get(key);
        if (imp.caso_id && !existing.cases.includes(imp.caso_id)) {
          existing.cases.push(imp.caso_id);
        }
        if (!existing.cedula && imp.cedula) existing.cedula = imp.cedula;
        if (!existing.telefono && imp.telefono) existing.telefono = imp.telefono;
        if (!existing.direccion && imp.direccion) existing.direccion = imp.direccion;
        if (!existing.email && imp.email) existing.email = imp.email;
        if (!existing.photo && imp.foto_url) existing.photo = imp.foto_url;
      }
    }

    return { configured: true, people: Array.from(map.values()) };
  } catch (err) {
    console.error('Error in listAllImplicadosGlobal:', err);
    return { configured: true, people: [] };
  }
}

export async function addGlobalImplicadoToDb(data: {
  nombre: string;
  cedula?: string | undefined;
  telefono?: string | undefined;
  direccion?: string | undefined;
  email?: string | undefined;
  rol?: string | undefined;
  foto_url?: string | undefined;
  caso_id?: string | undefined;
}) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, id: null };

  try {
    const newId = `imp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const { error } = await supabase.from('implicados').insert({
      id: newId,
      nombre: data.nombre,
      cedula: data.cedula || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      email: data.email || null,
      rol: data.rol || 'Cliente / Implicado',
      foto_url: data.foto_url || '',
      caso_id: data.caso_id || null,
      x: 50,
      y: 50,
      w: 240,
      h: 190,
      orden: 1,
    });

    if (error) {
      console.error('Error adding global implicado:', error);
      return { configured: true, id: null };
    }

    return { configured: true, id: newId };
  } catch (err) {
    console.error('Error in addGlobalImplicadoToDb:', err);
    return { configured: true, id: null };
  }
}

export async function syncChargesBetweenCases(data: {
  targetPersonId: string;
  chargesToSync: any[];
}) {
  if (!supabaseUrl || !supabaseKey) return { configured: false, syncedCount: 0 };

  try {
    const cleanTargetId = data.targetPersonId.replace('p-', '');
    let syncedCount = 0;

    // Obtener acusaciones existentes de la persona destino
    const { data: existingCharges } = await supabase
      .from('acusaciones')
      .select('titulo, numero')
      .eq('implicado_id', cleanTargetId);

    const existingTitles = new Set((existingCharges || []).map((c: any) => c.titulo?.trim().toLowerCase()));

    for (const c of data.chargesToSync) {
      // Ignorar si ya existe una acusación con el mismo título
      if (c.title && existingTitles.has(c.title.trim().toLowerCase())) {
        continue;
      }

      const cleanAcuId = `acu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const justField = c.fields?.find((f: any) => f.label === 'La justificación');
      const tipoField = c.fields?.find((f: any) => f.label === 'Tipo penal');

      await supabase.from('acusaciones').insert({
        id: cleanAcuId,
        implicado_id: cleanTargetId,
        numero: c.n,
        fecha: c.year || 'S/F',
        titulo: c.title || 'Acusación sincronizada',
        justificacion: justField ? justField.text : '',
        tipo_penal: tipoField ? tipoField.text : '',
      });

      const proofsField = c.fields?.find((f: any) => f.type === 'proofs');
      if (proofsField && proofsField.items) {
        for (const pr of proofsField.items) {
          await supabase.from('pruebas').insert({
            id: `pru-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            acusacion_id: cleanAcuId,
            etiqueta: pr.label,
            url: pr.url || '',
          });
        }
      }

      const tasksField = c.fields?.find((f: any) => f.type === 'tasks');
      if (tasksField && tasksField.items) {
        for (const tk of tasksField.items) {
          await supabase.from('gestiones').insert({
            id: `ges-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            acusacion_id: cleanAcuId,
            descripcion: tk.label,
          });
        }
      }

      syncedCount++;
    }

    return { configured: true, syncedCount };
  } catch (err) {
    console.error('Error in syncChargesBetweenCases:', err);
    return { configured: true, syncedCount: 0 };
  }
}