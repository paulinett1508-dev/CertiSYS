import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, Eye, Edit, Trash2, FileDown, FileSpreadsheet } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/dateUtils";
import type { CertificateWithRelations, Client } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CertificateFilters } from "@/components/certificate-filters";

export default function Certificates() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<{
    search?: string;
    clientId?: string;
    type?: string[];
    status?: string[];
    expiryFrom?: string;
    expiryTo?: string;
  }>({});

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Não autenticado",
        description: "Você será redirecionado para fazer login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.clientId) params.append("clientId", filters.clientId);
    if (filters.type) filters.type.forEach(t => params.append("type", t));
    if (filters.status) filters.status.forEach(s => params.append("status", s));
    if (filters.expiryFrom) params.append("expiryFrom", filters.expiryFrom);
    if (filters.expiryTo) params.append("expiryTo", filters.expiryTo);
    return params.toString();
  };

  const { data: certificates, isLoading } = useQuery<CertificateWithRelations[]>({
    queryKey: ["/api/certificates", filters],
    queryFn: async () => {
      const queryString = buildQueryString();
      const url = queryString ? `/api/certificates?${queryString}` : "/api/certificates";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch certificates");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user,
  });

  const handleExportPDF = async () => {
    try {
      const queryString = buildQueryString();
      const url = queryString ? `/api/reports/export/pdf?${queryString}` : "/api/reports/export/pdf";
      const response = await fetch(url, { credentials: "include" });
      
      if (!response.ok) throw new Error("Falha ao gerar PDF");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `certidoes-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
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
      const queryString = buildQueryString();
      const url = queryString ? `/api/reports/export/excel?${queryString}` : "/api/reports/export/excel";
      const response = await fetch(url, { credentials: "include" });
      
      if (!response.ok) throw new Error("Falha ao gerar Excel");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `certidoes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
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

  if (authLoading || isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold" data-testid="text-certificates-title">
          Certidões
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" size="sm" data-testid="button-export-pdf">
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm" data-testid="button-export-excel">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button asChild data-testid="button-new-certificate">
            <a href="/certificates/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Certidão
            </a>
          </Button>
        </div>
      </div>

      <CertificateFilters
        onFilter={setFilters}
        clients={clients?.map(c => ({ id: c.id, name: c.name })) || []}
      />

      <Card>
        <CardContent className="p-0">
          {!certificates || certificates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma certidão encontrada</p>
              {Object.keys(filters).length > 0 ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setFilters({})}
                  data-testid="button-clear-filters"
                >
                  Limpar filtros
                </Button>
              ) : (
                <Button asChild className="mt-4" variant="outline">
                  <a href="/certificates/new">Cadastrar primeira certidão</a>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Cliente</th>
                    <th className="text-left p-4 font-medium">Tipo</th>
                    <th className="text-left p-4 font-medium">Órgão Emissor</th>
                    <th className="text-left p-4 font-medium">Emissão</th>
                    <th className="text-left p-4 font-medium">Validade</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className="border-b hover-elevate"
                      data-testid={`row-certificate-${cert.id}`}
                    >
                      <td className="p-4 font-medium">{cert.client.name}</td>
                      <td className="p-4 text-sm">{cert.type}</td>
                      <td className="p-4 text-sm">{cert.issuingAuthority}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(cert.issueDate)}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(cert.expiryDate)}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={cert.status} />
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-actions-${cert.id}`}>
                              Ações
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`/certificates/${cert.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/certificates/${cert.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </a>
                            </DropdownMenuItem>
                            {cert.documentUrl && (
                              <DropdownMenuItem asChild>
                                <a href={cert.documentUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
