import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Eye, Edit, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/dateUtils";
import type { CertificateWithRelations } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Certificates() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const { data: certificates, isLoading } = useQuery<CertificateWithRelations[]>({
    queryKey: ["/api/certificates"],
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const filteredCertificates = certificates?.filter((cert) => {
    const matchesSearch =
      cert.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold" data-testid="text-certificates-title">
          Certidões
        </h1>
        <Button asChild data-testid="button-new-certificate">
          <a href="/certificates/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Certidão
          </a>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, tipo ou órgão..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="valid">Válidas</SelectItem>
                <SelectItem value="expiring_soon">Vencendo em breve</SelectItem>
                <SelectItem value="expired">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma certidão encontrada</p>
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
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
                  {filteredCertificates.map((cert) => (
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
