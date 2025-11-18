import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Shield, Eye, BookUser } from "lucide-react";
import { formatDateTime } from "@/lib/dateUtils";
import type { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { EditUserRoleDialog } from "@/components/edit-user-role-dialog";

export default function Users() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
      return;
    }

    if (!authLoading && user && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem acessar esta página",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    }
  }, [user, authLoading, isAdmin, toast]);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && isAdmin,
  });

  if (authLoading || isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getRoleConfig = (role: string) => {
    switch (role) {
      case "admin":
        return {
          label: "Administrador",
          icon: Shield,
          variant: "default" as const,
          className: "bg-primary text-primary-foreground",
        };
      case "accountant":
        return {
          label: "Contador",
          icon: BookUser,
          variant: "secondary" as const,
          className: "",
        };
      case "viewer":
        return {
          label: "Visualizador",
          icon: Eye,
          variant: "outline" as const,
          className: "",
        };
      default:
        return {
          label: role,
          icon: Eye,
          variant: "outline" as const,
          className: "",
        };
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-users-title">
            Gerenciamento de Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie perfis e permissões dos usuários do sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário cadastrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => {
                const roleConfig = getRoleConfig(u.role);
                const RoleIcon = roleConfig.icon;

                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover-elevate"
                    data-testid={`user-item-${u.id}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={u.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {u.firstName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {u.firstName && u.lastName
                          ? `${u.firstName} ${u.lastName}`
                          : u.email}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                      {u.updatedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Último acesso: {formatDateTime(u.updatedAt)}
                        </div>
                      )}
                    </div>

                    <Badge
                      variant={roleConfig.variant}
                      className={roleConfig.className}
                      data-testid={`badge-role-${u.id}`}
                    >
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleConfig.label}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingUser(u);
                        setDialogOpen(true);
                      }}
                      data-testid={`button-edit-user-${u.id}`}
                    >
                      Editar Perfil
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informações sobre Perfis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Administrador</div>
              <div className="text-sm text-muted-foreground">
                Controle total do sistema. Pode gerenciar usuários, perfis e todas as certidões.
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <BookUser className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium">Contador</div>
              <div className="text-sm text-muted-foreground">
                Pode inserir, editar e visualizar certidões dos seus clientes.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium">Visualizador</div>
              <div className="text-sm text-muted-foreground">
                Acesso somente leitura aos dados do sistema.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditUserRoleDialog
        user={editingUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
