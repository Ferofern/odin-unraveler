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

// Data inicial vacía para cuando la BD no tiene registros o se reinicia la app
export const CASE_PEOPLE: Person[] = [];