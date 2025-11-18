import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, AlertTriangle, XCircle, Plus } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, getDaysUntilExpiry } from "@/lib/dateUtils";
import type { Certificate, CertificateWithRelations } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

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

  const { data: certificates, isLoading: certsLoading } = useQuery<CertificateWithRelations[]>({
    queryKey: ["/api/certificates"],
    enabled: !!user,
  });

  if (authLoading || certsLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    total: certificates?.length || 0,
    valid: certificates?.filter((c) => c.status === "valid").length || 0,
    expiringSoon: certificates?.filter((c) => c.status === "expiring_soon").length || 0,
    expired: certificates?.filter((c) => c.status === "expired").length || 0,
  };

  const recentCertificates = certificates
    ?.slice()
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 10) || [];

  const upcomingExpirations = certificates
    ?.filter((c) => c.status === "expiring_soon")
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 5) || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-dashboard-title">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo, {user?.firstName || user?.email}
          </p>
        </div>
        <Button asChild data-testid="button-new-certificate">
          <a href="/certificates/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Certidão
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Certidões</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid="text-stat-total">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Válidas</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500" data-testid="text-stat-valid">
              {stats.valid}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em Breve</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-500" data-testid="text-stat-expiring">
              {stats.expiringSoon}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <XCircle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive" data-testid="text-stat-expired">
              {stats.expired}
            </div>
          </CardContent>
        </Card>
      </div>

      {upcomingExpirations.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vencimentos Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingExpirations.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`item-expiring-${cert.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{cert.client.name}</div>
                    <div className="text-sm text-muted-foreground">{cert.type}</div>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-sm font-medium">
                      Vence em {getDaysUntilExpiry(cert.expiryDate)} dias
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(cert.expiryDate)}
                    </div>
                  </div>
                  <StatusBadge status={cert.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCertificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma certidão cadastrada ainda</p>
              <Button asChild className="mt-4" variant="outline">
                <a href="/certificates/new">Cadastrar primeira certidão</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                  data-testid={`item-recent-${cert.id}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{cert.client.name}</div>
                    <div className="text-sm text-muted-foreground">{cert.type} - {cert.issuingAuthority}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mr-4">
                    Vencimento: {formatDate(cert.expiryDate)}
                  </div>
                  <StatusBadge status={cert.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
