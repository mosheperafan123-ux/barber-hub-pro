import { ThemeProvider } from 'next-themes';
import { Header } from '@/components/dashboard/Header';
import { KPIGrid } from '@/components/dashboard/KPIGrid';
import { ChartsGrid } from '@/components/dashboard/ChartsGrid';
import { CitasTable } from '@/components/dashboard/CitasTable';
import { useCitasData, useCuentasData } from '@/hooks/useDashboardData';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const { data: citas, isLoading: citasLoading, error: citasError, refetch: refetchCitas } = useCitasData();
  const { data: cuentas, isLoading: cuentasLoading, error: cuentasError, refetch: refetchCuentas } = useCuentasData();
  
  const isLoading = citasLoading || cuentasLoading;
  const hasError = citasError || cuentasError;
  
  const handleRefresh = () => {
    refetchCitas();
    refetchCuentas();
  };
  
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen bg-gradient-subtle p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          <Header onRefresh={handleRefresh} isRefreshing={isLoading} />
          
          {hasError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error al cargar los datos. Por favor, verifica la configuración de las hojas de cálculo e intenta nuevamente.
              </AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            </div>
          ) : citas && cuentas ? (
            <>
              <KPIGrid citas={citas} cuentas={cuentas} />
              <ChartsGrid citas={citas} cuentas={cuentas} />
              <CitasTable citas={citas} />
            </>
          ) : null}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
