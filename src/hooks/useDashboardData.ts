import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseCitasCSV, parseCuentasCSV, type Cita, type CuentaMensual } from '@/lib/csvParser';

const CITAS_URL = 'https://docs.google.com/spreadsheets/d/1Tz9mZ3Nw9ckreHBo5py2y0JBfmmQIoyTJREISZfh2es/export?format=csv';
const CUENTAS_URL = 'https://docs.google.com/spreadsheets/d/11p-_bAE_Op8grc9f1KZEFGtMH1zd8fLhAqVscCwHfmI/export?format=csv';

async function fetchCSVViaProxy(url: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('csv-proxy', {
    body: { url },
  });

  if (error) {
    console.error('Error fetching CSV:', error);
    throw new Error(`Failed to fetch CSV: ${error.message}`);
  }
  
  // La edge function devuelve directamente el texto CSV
  if (typeof data === 'string') {
    return data;
  }
  
  throw new Error('Invalid response format from csv-proxy');
}

export function useCitasData() {
  return useQuery<Cita[]>({
    queryKey: ['citas'],
    queryFn: async () => {
      const csvText = await fetchCSVViaProxy(CITAS_URL);
      return parseCitasCSV(csvText);
    },
    refetchInterval: 30000, // 30 segundos
    staleTime: 20000,
  });
}

export function useCuentasData() {
  return useQuery<CuentaMensual[]>({
    queryKey: ['cuentas'],
    queryFn: async () => {
      const csvText = await fetchCSVViaProxy(CUENTAS_URL);
      return parseCuentasCSV(csvText);
    },
    refetchInterval: 30000,
    staleTime: 20000,
  });
}
