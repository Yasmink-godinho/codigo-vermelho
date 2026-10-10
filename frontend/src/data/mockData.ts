export * from "./mockData.tsx";

import { institutionsData, DEMO_LOTES } from "./mockData.tsx";

// Aliases para compatibilidade total com qualquer importação em inglês ou português
export const institutions = institutionsData;
export const instituicoes = institutionsData;

export const lotes = DEMO_LOTES;
export const initialLotes = DEMO_LOTES;