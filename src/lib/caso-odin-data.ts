export interface Charge {
  id: string;
  n: string;
  year: string;
  title: string;
  just: string;
  proofs: string[];
  tasks: string[];
}

export interface Person {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  charges: Charge[];
}

export const CASE_DATA: Omit<Person, "id">[] = [
  {
    name: "Patricia Mercedes Tapia Macías",
    role: "Implicada 01",
    x: 12.5,
    y: 27,
    charges: [
      {
        id: "p0c0",
        n: "Acusación 1",
        year: "2022",
        title: "Solar 12, manzana 287 — Febres Cordero, Guayaquil",
        just: "Valor de $4,871 pagado entre 2015 y 2017 a la MIMG; compraventa autorizada en 2015 y transferencia en 2022 por un bien ya pagado.",
        proofs: [
          "Foja 1246 — C/V Municipio",
          "Foja 1043 — Certificado Registro de Propiedad",
          "Foja 3954 — BCN estados de cuenta 2011-2012",
          "Foja 5217 — Préstamos BCN 2010-2011",
          "Foja 5311 — Respuesta MIMG",
          "Foja 5627 — Mecanizado IESS, último pago enero 2016",
        ],
        tasks: [],
      },
      {
        id: "p0c1",
        n: "Acusación 2",
        year: "2024",
        title: "Compra Nissan Versa, placas GPS-7533",
        just: "Trabajó 14 años en la función judicial percibiendo entre $600 y $1,600 mensuales.",
        proofs: ["Foja 4250 — Respuesta FACJ años de servicio 2001-2015", "Foja 5627 — Mecanizado IESS"],
        tasks: ["Solicitar liquidación por los 14 años de servicio"],
      },
      {
        id: "p0c2",
        n: "Acusación 3",
        year: "2025",
        title: "Oficina Cien Olivos parc., sin registrar",
        just: "Valor de $80,000 cancelado mediante cheque.",
        proofs: ["Foja 1808 — Compraventa del bien", "Peritaje económico financiero"],
        tasks: ["Versión de Dieter Gerardo Koeh Santiestevan", "Versión de José Luis Valero Del Hierro"],
      },
      {
        id: "p0c3",
        n: "Acusación 4",
        year: "2025",
        title: "Ingresos inusuales de $88,360 no justificados",
        just: "$80,000 corresponden al dinero de la compra de la casa transferido por un tercero.",
        proofs: [],
        tasks: ["Solicitar pericia financiera y contable"],
      },
      {
        id: "p0c4",
        n: "Acusación 5",
        year: "2025",
        title: "Presidenta de Petro&Logic",
        just: "",
        proofs: [],
        tasks: [],
      },
    ],
  },
  {
    name: "Jacqueline Naomi Naula González",
    role: "Implicada 02",
    x: 37.5,
    y: 27,
    charges: [
      {
        id: "p1c0",
        n: "Acusación 1",
        year: "2021",
        title: "Compra Chevrolet Cavalier, placa GCB7796, por $15,500",
        just: "El trabajo entre agosto y diciembre generó $1,878.15.",
        proofs: ["Foja 441 — Mecanizado IESS", "Foja 5584 — Respuesta Coheco"],
        tasks: ["Insistir en Montepío IESS"],
      },
      {
        id: "p1c1",
        n: "Acusación 2",
        year: "2022",
        title: "Venta mediante fideicomiso de KIA Stonic, placa PDR4892, por $20,300",
        just: "Pago en efectivo.",
        proofs: ["Foja 2919 — Respuesta Fideval con compraventa"],
        tasks: [],
      },
      {
        id: "p1c2",
        n: "Acusación 3",
        year: "2022",
        title: "Accionista de Petro&Logic",
        just: "",
        proofs: [],
        tasks: ["Pericia financiera técnica"],
      },
      {
        id: "p1c3",
        n: "Acusación 4",
        year: "2022",
        title: "Compra Chevrolet Captiva Premier, placa GT13725, por $24,235.59",
        just: "",
        proofs: [],
        tasks: [
          "Versión del representante de Corporación Nexum NexumCorp S.A.",
          "Versión de Moreira Dávila Andrés José",
          "Versión de Coronel Beltrán Luis Joaquín",
        ],
      },
      {
        id: "p1c4",
        n: "Acusación 5",
        year: "2023",
        title: "Compra Toyota Rush por $30,999 mediante múltiples depósitos",
        just: "Ingreso de trabajo 2023 por $8,372 y deuda de pagaré a la orden.",
        proofs: ["Foja 1962 — Respuesta Toyocosta", "Foja 3030 — Respuesta Toyocosta depósitos", "Foja 5280 — Respuesta Tolepu"],
        tasks: [],
      },
      {
        id: "p1c5",
        n: "Acusación 6",
        year: "2023",
        title: "Transferencia recibida por $20,732.80",
        just: "Reliquidación de la pensión del padre, de quien es apoderada.",
        proofs: ["Foja 3070 — Respuesta Min. Economía", "Foja 5578 — Certificación dirección distrital"],
        tasks: [],
      },
      {
        id: "p1c6",
        n: "Acusación 7",
        year: "2023",
        title: "Venta Chevrolet Captiva GT13725 por $15,500",
        just: "",
        proofs: ["Foja 1861 — C/V Captiva"],
        tasks: ["Versión del comprador Dennys Brayan Reyna Bravo"],
      },
      {
        id: "p1c7",
        n: "Acusación 8",
        year: "2025",
        title: "Compraventa de terreno en San José, Naranjito, por $40,000",
        just: "",
        proofs: ["Foja 2654 — Escritura de notaría con transferencia de $40,000"],
        tasks: ["Versión de Marco Antonio Guerrero Jiménez"],
      },
    ],
  },
  {
    name: "Jacqueline del Carmen González Suárez",
    role: "Implicada 03",
    x: 62.5,
    y: 27,
    charges: [
      {
        id: "p2c0",
        n: "Acusación 1",
        year: "2020",
        title: "Compra de casa en Samanes V por $57,108.00",
        just: "Compra con dinero de compraventas de casas de Sauces.",
        proofs: ["Foja 5587 — C/V de la casa", "Foja 4220", "Foja 4264 — Respuesta Consejo de la Judicatura"],
        tasks: [],
      },
      {
        id: "p2c1",
        n: "Acusación 2",
        year: "2021",
        title: "Compra de inmueble en Gral. Villamil, Playas, por $200,000",
        just: "El esposo pagó a los vendedores; transferencia post mortem.",
        proofs: ["Foja 593 — Historia de dominio", "Foja 2614 — Compraventa notaría", "Foja 5242 — Versión de Enrique Parrales"],
        tasks: [],
      },
      {
        id: "p2c2",
        n: "Acusación 3",
        year: "2023",
        title: "Compra de inmueble en La Aurora (Vicriel) por $165,000",
        just: "Pagado con la venta de joyas y oro del esposo y de la madre.",
        proofs: ["Foja 521 — Historia de dominio", "Foja 2136 — Escritura de compraventa"],
        tasks: [
          "Versiones de Peter Fuentes y Francis Escobar",
          "Cheques certificados",
          "Oficiar a compradores de joyas",
          "Préstamo quirografario",
        ],
      },
      {
        id: "p2c3",
        n: "Acusación 4",
        year: "2024",
        title: "Venta de inmueble en Samanes V por $85,733.00",
        just: "El pago lo recibe Daniel.",
        proofs: ["Foja 1070 — Registro de Propiedad", "Fojas 2161 y 3383 — Escritura de compraventa"],
        tasks: [],
      },
    ],
  },
  {
    name: "Daniel Adolfo Naula González",
    role: "Implicado 04",
    x: 87.5,
    y: 27,
    charges: [
      {
        id: "p3c0",
        n: "Acusación 1",
        year: "2018-2025",
        title: "Desproporción de ingresos",
        just: "Trabajos independientes pagados en efectivo.",
        proofs: [],
        tasks: ["Solicitar estados de cuenta al Banco Pichincha", "Oficiar a Petrologic S.A."],
      },
      {
        id: "p3c1",
        n: "Acusación 2",
        year: "S/F",
        title: "Ingreso de dinero en efectivo por $136,616.28",
        just: "Realizaba servicio de courier.",
        proofs: [],
        tasks: ["Oficiar a la empresa de courier", "Materialización de Facebook", "Versiones de 7 clientes específicos"],
      },
      {
        id: "p3c2",
        n: "Acusación 3",
        year: "2019",
        title: "Compra Nissan X-Trail por $23,500",
        just: "",
        proofs: ["Foja 1518 — Respuesta Automotores y Anexos"],
        tasks: [],
      },
      {
        id: "p3c3",
        n: "Acusación 4",
        year: "2020",
        title: "Compra del yate Michelle 2",
        just: "",
        proofs: ["Foja 2389 — C/V compra", "Foja 1879 — C/V venta"],
        tasks: ["Versión de Oliver Panchana"],
      },
      {
        id: "p3c4",
        n: "Acusación 5",
        year: "2022",
        title: "Compra vehículo Tundra por $23,500",
        just: "Nunca estuvo a su nombre; depósitos realizados con cédula robada.",
        proofs: ["Foja 1536 — Respuesta Primatrade S.A."],
        tasks: ["Certificación de documentos extraviados", "Pericia grafológica", "Versión del comprador original"],
      },
      {
        id: "p3c5",
        n: "Acusación 6",
        year: "S/F",
        title: "Conexión con el caso Metástasis",
        just: "",
        proofs: ["Foja 4243 — Respuesta Corte Nacional de Justicia, no vinculación"],
        tasks: [],
      },
      {
        id: "p3c6",
        n: "Acusación 7",
        year: "2024",
        title: "Depósito por $85,733.00",
        just: "",
        proofs: [],
        tasks: ["Declaración juramentada por diputación al pago de parte de la madre"],
      },
      {
        id: "p3c7",
        n: "Acusación 8",
        year: "2024",
        title: "Compra Vistana 300",
        just: "",
        proofs: ["Foja 3874", "Foja 4038 — Respuesta Banco Pichincha", "Foja 4182 — Tabla de amortización", "Foja 4100 — Pagos"],
        tasks: ["Certificaciones de transferencias", "Certificación bancaria sobre póliza", "Versión de Melissa Pazmiño"],
      },
    ],
  },
];

export const CASE_PEOPLE: Person[] = CASE_DATA.map((p, i) => ({
  ...p,
  id: `p${i}`,
  charges: p.charges.map((c) => ({ ...c })),
}));
