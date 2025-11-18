import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Bell, Shield, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-landing-title">
            Sistema de Gestão de Certidões Negativas
          </h1>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-landing-subtitle">
            Monitore e gerencie certidões com controle de validade e notificações automáticas
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Entrar com Replit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Gestão Completa</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre e organize todas as certidões dos seus clientes em um só lugar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Notificações Automáticas</h3>
              <p className="text-sm text-muted-foreground">
                Receba alertas antes do vencimento das certidões
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Controle de Acesso</h3>
              <p className="text-sm text-muted-foreground">
                Perfis de usuário com permissões personalizadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Dashboard Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Visualize o status de todas as certidões de forma clara
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-xl p-8 border">
          <h2 className="text-2xl font-semibold mb-4">Recursos Principais</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Cadastro completo de certidões com upload de documentos PDF</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Alertas visuais para certidões vencidas e próximas do vencimento</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Filtros avançados por status, cliente e tipo de certidão</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Sistema de permissões: Administrador, Contador e Visualizador</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Interface responsiva e moderna para desktop e mobile</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
