import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Cita, CuentaMensual } from '@/lib/csvParser';
import { startOfMonth, endOfMonth, parseISO, isToday, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChartsGridProps {
  citas: Cita[];
  cuentas: CuentaMensual[];
}

const COLORS = ['hsl(43, 74%, 49%)', 'hsl(43, 90%, 65%)', 'hsl(240, 8%, 40%)', 'hsl(240, 6%, 60%)', 'hsl(240, 4%, 80%)'];

export function ChartsGrid({ citas, cuentas }: ChartsGridProps) {
  const charts = useMemo(() => {
    // Tendencia ingresos del mes
    const inicioMes = startOfMonth(new Date());
    const finMes = endOfMonth(new Date());
    
    const tendenciaMensual = cuentas
      .filter(c => {
        try {
          const fecha = parseISO(c.fecha);
          return fecha >= inicioMes && fecha <= finMes;
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(c => ({
        fecha: format(parseISO(c.fecha), 'dd MMM', { locale: es }),
        ingresos: c.total,
      }));
    
    // Servicios más solicitados hoy
    const citasHoy = citas.filter(c => {
      try {
        return isToday(parseISO(c.dia));
      } catch {
        return false;
      }
    });
    
    const serviciosCounts = citasHoy.reduce((acc, cita) => {
      acc[cita.categoriaServicio] = (acc[cita.categoriaServicio] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const serviciosData = Object.entries(serviciosCounts).map(([name, value]) => ({
      name,
      value,
    }));
    
    // Distribución por horarios
    const horariosCounts = citasHoy.reduce((acc, cita) => {
      const hora = parseInt(cita.hora.split(':')[0]);
      let franja = '';
      
      if (hora >= 9 && hora < 12) franja = '09:00-12:00';
      else if (hora >= 12 && hora < 15) franja = '12:00-15:00';
      else if (hora >= 15 && hora < 18) franja = '15:00-18:00';
      else if (hora >= 18 && hora < 21) franja = '18:00-21:00';
      else franja = 'Otras';
      
      acc[franja] = (acc[franja] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const horariosData = Object.entries(horariosCounts).map(([franja, citas]) => ({
      franja,
      citas,
    }));
    
    // Comparación últimos 7 días
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
      const fecha = subDays(new Date(), 6 - i);
      const fechaStr = format(fecha, 'yyyy-MM-dd');
      const cuenta = cuentas.find(c => c.fecha === fechaStr);
      
      return {
        dia: format(fecha, 'EEE', { locale: es }),
        citas: cuenta?.agendados || 0,
        ingresos: cuenta?.total || 0,
      };
    });
    
    return {
      tendenciaMensual,
      serviciosData,
      horariosData,
      ultimos7Dias,
    };
  }, [citas, cuentas]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Tendencia mensual */}
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Ingresos del Mes</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={charts.tendenciaMensual}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="fecha" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="ingresos" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Servicios más solicitados */}
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Servicios Más Solicitados (Hoy)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={charts.serviciosData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {charts.serviciosData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Distribución horarios */}
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Distribución por Horarios (Hoy)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={charts.horariosData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="franja" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip />
            <Bar dataKey="citas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Comparación semanal */}
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Últimos 7 Días</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={charts.ultimos7Dias}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="dia" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="citas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="ingresos" fill="hsl(var(--primary-glow))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
