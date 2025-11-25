import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import type { Cita } from '@/lib/csvParser';
import { isToday, parseISO } from 'date-fns';

interface CitasTableProps {
  citas: Cita[];
}

export function CitasTable({ citas }: CitasTableProps) {
  const [search, setSearch] = useState('');
  
  const citasHoy = useMemo(() => {
    return citas
      .filter(c => {
        try {
          return isToday(parseISO(c.dia));
        } catch {
          return false;
        }
      })
      .filter(c => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          c.nombre.toLowerCase().includes(s) ||
          c.servicio.toLowerCase().includes(s) ||
          c.estatus.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => {
        const [horaA] = a.hora.split(':').map(Number);
        const [horaB] = b.hora.split(':').map(Number);
        return horaA - horaB;
      });
  }, [citas, search]);
  
  const getEstatusBadge = (estatus: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmada: 'default',
      pendiente: 'secondary',
      cancelada: 'destructive',
    };
    
    return (
      <Badge variant={variants[estatus] || 'outline'}>
        {estatus.charAt(0).toUpperCase() + estatus.slice(1)}
      </Badge>
    );
  };
  
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Citas del Día</h2>
        <Input
          placeholder="Buscar por nombre, servicio o estatus..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Teléfono</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {citasHoy.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay citas para mostrar
                </TableCell>
              </TableRow>
            ) : (
              citasHoy.map((cita) => (
                <TableRow key={cita.id} className="transition-smooth hover:bg-muted/30">
                  <TableCell className="font-medium">{cita.hora}</TableCell>
                  <TableCell>{cita.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cita.categoriaServicio}</Badge>
                  </TableCell>
                  <TableCell>€{cita.precio.toFixed(2)}</TableCell>
                  <TableCell>{getEstatusBadge(cita.estatus)}</TableCell>
                  <TableCell className="text-muted-foreground">{cita.numeroCelular}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
