import { format, parseISO, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';

export interface Cita {
  id: string;
  estatus: string;
  nombre: string;
  servicio: string;
  precio: number;
  dia: string;
  hora: string;
  numeroCelular: string;
  executionId: string;
  categoriaServicio: string;
}

export interface CuentaMensual {
  fecha: string;
  agendados: number;
  total: number;
}

// Normaliza precio: elimina símbolos, convierte 'k' a miles
export function normalizarPrecio(precioStr: string): number {
  if (!precioStr) return 0;
  
  const cleaned = precioStr
    .replace(/[€$COP\s]/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  if (cleaned.toLowerCase().includes('k')) {
    return parseFloat(cleaned.replace(/k/i, '')) * 1000;
  }
  
  return parseFloat(cleaned) || 0;
}

// Normaliza estatus a minúsculas
export function normalizarEstatus(estatus: string): string {
  return estatus?.toLowerCase().trim() || 'desconocido';
}

// Normaliza fecha a YYYY-MM-DD
export function normalizarFecha(fecha: string): string {
  if (!fecha) return '';
  
  try {
    // Si ya está en formato ISO
    if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fecha;
    }
    
    // Intenta parsear otros formatos comunes
    const parsed = new Date(fecha);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }
    
    return fecha;
  } catch {
    return fecha;
  }
}

// Normaliza hora a HH:mm (toma la primera si es rango)
export function normalizarHora(hora: string): string {
  if (!hora) return '';
  
  // Si es un rango (ej: "10:00-11:00"), toma la primera
  const match = hora.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : hora;
}

// Categoriza servicio
export function categorizarServicio(servicio: string): string {
  if (!servicio) return 'Otros';
  
  const s = servicio.toLowerCase();
  
  if (s.includes('corte') && (s.includes('barba') || s.includes('afeitado'))) {
    return 'Corte+Barba';
  }
  if (s.includes('corte')) return 'Corte';
  if (s.includes('barba') || s.includes('afeitado')) return 'Afeitado';
  if (s.includes('tinte') || s.includes('color')) return 'Tinte';
  
  return 'Otros';
}

// Parse CSV de citas usando PapaParse
export function parseCitasCSV(csvText: string): Cita[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  
  if (result.errors.length > 0) {
    console.error('CSV Parse errors:', result.errors);
  }
  
  const citas = result.data.map((row: any, idx: number) => ({
    id: row.id || `cita-${idx}`,
    estatus: normalizarEstatus(row.estatus),
    nombre: row.nombre || '',
    servicio: row.servicio || '',
    precio: normalizarPrecio(row['precio del servicio'] || row.precio || ''),
    dia: normalizarFecha(row.dia),
    hora: normalizarHora(row.hora),
    numeroCelular: row['numero de celular'] || row['número celular'] || row['numero celular'] || row.numero || '',
    executionId: row['execution id'] || row.executionid || '',
    categoriaServicio: categorizarServicio(row.servicio),
  }));
  
  console.log(`Parsed ${citas.length} citas from CSV`);
  return citas;
}

// Parse CSV de cuentas mensuales usando PapaParse
export function parseCuentasCSV(csvText: string): CuentaMensual[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });
  
  if (result.errors.length > 0) {
    console.error('CSV Parse errors:', result.errors);
  }
  
  const cuentas = result.data.map((row: any) => ({
    fecha: normalizarFecha(row.fecha),
    agendados: parseInt(row.agendas || row.agendados) || 0,
    total: normalizarPrecio(row.total),
  }));
  
  console.log(`Parsed ${cuentas.length} cuentas from CSV`);
  return cuentas;
}
