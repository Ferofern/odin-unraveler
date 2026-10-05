-- ========================================================================
-- SCRIPT DE MIGRACIÓN POSTGRESQL: MULTI-CASOS, CÉDULAS, CAMPOS DE CLIENTE Y ESTILOS
-- ========================================================================
-- IMPORTANTE: Este script es idempotente y NO borra ninguna información existente.
-- Asigna la información actual al caso inicial "caso Odin".

-- 1. Crear tabla casos (ID, Nombre Del Caso, Tipo Penal, fecha de creación, estilo)
CREATE TABLE IF NOT EXISTS public.casos (
  id text NOT NULL,
  nombre text NOT NULL,
  tipo_penal text NOT NULL DEFAULT 'Penal',
  fecha_creacion date NOT NULL DEFAULT CURRENT_DATE,
  estilo text NOT NULL DEFAULT 'penal', -- 'penal' (Noir vino), 'civil' (Azul medianoche), 'familiar' (Esmeralda cálido)
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT casos_pkey PRIMARY KEY (id)
);

-- 2. Asegurar que exista la tabla papelera_reciclaje
CREATE TABLE IF NOT EXISTS public.papelera_reciclaje (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tabla_origen text NOT NULL,
  datos_borrados jsonb NOT NULL,
  borrado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT papelera_reciclaje_pkey PRIMARY KEY (id)
);

-- 3. Añadir nuevas columnas a la tabla implicados (sin romper la data actual)
-- caso_id: relación opcional (un cliente/implicado puede existir globalmente o asignarse a un caso)
ALTER TABLE public.implicados 
  ADD COLUMN IF NOT EXISTS caso_id text REFERENCES public.casos(id) ON DELETE SET NULL;

ALTER TABLE public.implicados 
  ADD COLUMN IF NOT EXISTS cedula character varying(20);

ALTER TABLE public.implicados 
  ADD COLUMN IF NOT EXISTS telefono character varying(50);

ALTER TABLE public.implicados 
  ADD COLUMN IF NOT EXISTS direccion text;

ALTER TABLE public.implicados 
  ADD COLUMN IF NOT EXISTS email character varying(255);

-- 4. Insertar el caso existente "caso Odin" con tipo penal "Penal" y fecha de hoy (CURRENT_DATE)
INSERT INTO public.casos (id, nombre, tipo_penal, fecha_creacion, estilo)
VALUES ('caso-odin', 'caso Odin', 'Penal', CURRENT_DATE, 'penal')
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre,
    tipo_penal = EXCLUDED.tipo_penal,
    estilo = EXCLUDED.estilo;

-- 5. Asignar todos los implicados existentes actuales al "caso Odin" (para no perder nada)
UPDATE public.implicados 
SET caso_id = 'caso-odin' 
WHERE caso_id IS NULL;

-- 6. Actualizar cédulas de los 5 implicados especificados
UPDATE public.implicados 
SET cedula = '0908162373' 
WHERE trim(lower(nombre)) ILIKE '%jaqueline%carmen%gonz%lez%su%rez%'
   OR trim(lower(nombre)) ILIKE '%jaqueline%gonzalez%';

UPDATE public.implicados 
SET cedula = '0926077793' 
WHERE trim(lower(nombre)) ILIKE '%daniel%adolfo%naula%gonz%lez%'
   OR trim(lower(nombre)) ILIKE '%daniel%naula%';

UPDATE public.implicados 
SET cedula = '0932145220' 
WHERE trim(lower(nombre)) ILIKE '%jacqueline%naomi%naula%gonz%lez%'
   OR trim(lower(nombre)) ILIKE '%naomi%naula%';

UPDATE public.implicados 
SET cedula = '0909821381' 
WHERE trim(lower(nombre)) ILIKE '%patricia%mercedes%tapia%mac%as%'
   OR trim(lower(nombre)) ILIKE '%patricia%tapia%';

UPDATE public.implicados 
SET cedula = '0923732481' 
WHERE trim(lower(nombre)) ILIKE '%nathalie%stephanie%burgos%tapia%'
   OR trim(lower(nombre)) ILIKE '%nathalie%burgos%';
