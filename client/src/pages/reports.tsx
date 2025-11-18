import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const { data: statistics, isLoading } = useQuery<{
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>({
    queryKey: ["/api/reports/statistics"],
  });

  const handleExportPDF = async () => {
    try {
      const response = await fetch("/api/reports/export/pdf", {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Falha ao gerar PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-certidoes-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF gerado com sucesso",
        description: "O relatório foi baixado",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch("/api/reports/export/excel", {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Falha ao gerar Excel");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-certidoes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Excel gerado com sucesso",
        description: "O relatório foi baixado",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar Excel",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando estatísticas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Estatísticas e exportação de dados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" data-testid="button-export-excel">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-stat-total">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Certidões</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-total">
              {statistics?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-active">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-stat-active">
              {statistics?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-expiring">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em Breve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-stat-expiring">
              {statistics?.expiringSoon || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-expired">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-stat-expired">
              {statistics?.expired || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por Tipo</CardTitle>
            <CardDescription>Distribuição por tipo de certidão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics && Object.entries(statistics.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center" data-testid={`stat-type-${type}`}>
                  <span className="text-sm">{type}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {(!statistics || Object.keys(statistics.byType).length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Status</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics && Object.entries(statistics.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center" data-testid={`stat-status-${status}`}>
                  <span className="text-sm">
                    {status === "active" ? "Ativa" : status === "expiring_soon" ? "Vencendo" : "Vencida"}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {(!statistics || Object.keys(statistics.byStatus).length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
