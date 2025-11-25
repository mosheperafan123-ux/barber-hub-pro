import { Calendar, Euro, Clock, TrendingUp } from 'lucide-react';
import { KPICard } from './KPICard';
import { useMemo } from 'react';
import { isToday, parseISO, differenceInMinutes, startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Cita, CuentaMensual } from '@/lib/csvParser';

interface KPIGridProps {
  citas: Cita[];
  cuentas: CuentaMensual[];
}

const META_MENSUAL = 15000; // EUR

export function KPIGrid({ citas, cuentas }: KPIGridProps) {
  const kpis = useMemo(() => {
    // Citas de hoy
    const citasHoy = citas.filter(c => {
      try {
        return isToday(parseISO(c.dia));
      } catch {
        return false;
      }
    });
    
    const confirmadas = citasHoy.filter(c => c.estatus === 'confirmada').length;
    const pendientes = citasHoy.filter(c => c.estatus === 'pendiente').length;
    
    // Ingresos hoy
    const ingresosHoy = citasHoy
      .filter(c => c.estatus === 'confirmada')
      .reduce((sum, c) => sum + c.precio, 0);
    
    // Próxima cita
    const ahora = new Date();
    const citasPendientes = citasHoy
      .filter(c => {
        try {
          const [hora, minuto] = c.hora.split(':').map(Number);
          const citaTime = new Date();
          citaTime.setHours(hora, minuto, 0, 0);
          return citaTime > ahora;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const [horaA] = a.hora.split(':').map(Number);
        const [horaB] = b.hora.split(':').map(Number);
        return horaA - horaB;
      });
    
    const proximaCita = citasPendientes[0];
    let tiempoRestante = '';
    
    if (proximaCita) {
      try {
        const [hora, minuto] = proximaCita.hora.split(':').map(Number);
        const citaTime = new Date();
        citaTime.setHours(hora, minuto, 0, 0);
        const minutos = differenceInMinutes(citaTime, ahora);
        
        if (minutos < 60) {
          tiempoRestante = `En ${minutos} min`;
        } else {
          const horas = Math.floor(minutos / 60);
          tiempoRestante = `En ${horas}h ${minutos % 60}m`;
        }
      } catch {}
    }
    
    // Avance mensual
    const inicioMes = startOfMonth(new Date());
    const finMes = endOfMonth(new Date());
    
    const cuentasMes = cuentas.filter(c => {
      try {
        const fecha = parseISO(c.fecha);
        return fecha >= inicioMes && fecha <= finMes;
      } catch {
        return false;
      }
    });
    
    const ingresosMes = cuentasMes.reduce((sum, c) => sum + c.total, 0);
    const porcentajeMeta = (ingresosMes / META_MENSUAL) * 100;
    
    return {
      citasHoy: {
        total: citasHoy.length,
        confirmadas,
        pendientes,
      },
      ingresosHoy,
      proximaCita,
      tiempoRestante,
      ingresosMes,
      porcentajeMeta,
    };
  }, [citas, cuentas]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <KPICard
        title="Citas de Hoy"
        value={kpis.citasHoy.total}
        subtitle={`${kpis.citasHoy.confirmadas} confirmadas · ${kpis.citasHoy.pendientes} pendientes`}
        icon={Calendar}
        trend={kpis.citasHoy.total > 0 ? { value: 12, isPositive: true } : undefined}
      />
      
      <KPICard
        title="Ingresos Hoy"
        value={`€${kpis.ingresosHoy.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
        icon={Euro}
        trend={{ value: 8, isPositive: true }}
      />
      
      <KPICard
        title="Próxima Cita"
        value={kpis.proximaCita ? kpis.proximaCita.hora : '--:--'}
        subtitle={kpis.proximaCita 
          ? `${kpis.proximaCita.nombre} · ${kpis.proximaCita.servicio}`
          : 'No hay citas pendientes'
        }
        icon={Clock}
        className={kpis.tiempoRestante ? 'ring-2 ring-primary/50 animate-pulse-glow' : ''}
      />
      
      <KPICard
        title="Avance Mensual"
        value={`${kpis.porcentajeMeta.toFixed(1)}%`}
        subtitle={`€${kpis.ingresosMes.toLocaleString('es-ES')} de €${META_MENSUAL.toLocaleString('es-ES')}`}
        icon={TrendingUp}
        trend={{ 
          value: kpis.porcentajeMeta > 50 ? 15 : -5, 
          isPositive: kpis.porcentajeMeta > 50 
        }}
      />
    </div>
  );
}
