import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, BookUser, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface EditUserRoleDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserRoleDialog({
  user,
  open,
  onOpenChange,
}: EditUserRoleDialogProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || "viewer");

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user?.id, user?.role]);

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      if (!user) return;
      await apiRequest("PATCH", `/api/users/${user.id}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Perfil atualizado",
        description: "O perfil do usuário foi alterado com sucesso",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  const roleOptions = [
    {
      value: "admin",
      label: "Administrador",
      description: "Controle total do sistema",
      icon: Shield,
    },
    {
      value: "accountant",
      label: "Contador",
      description: "Gerencia certidões de seus clientes",
      icon: BookUser,
    },
    {
      value: "viewer",
      label: "Visualizador",
      description: "Acesso somente leitura",
      icon: Eye,
    },
  ];

  const handleSave = () => {
    updateRoleMutation.mutate(selectedRole);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-edit-user-role">
        <DialogHeader>
          <DialogTitle>Alterar Perfil do Usuário</DialogTitle>
          <DialogDescription>
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="mb-4 block">Selecione o novo perfil:</Label>
          <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
            <div className="space-y-3">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 border rounded-lg p-4 hover-elevate cursor-pointer"
                    onClick={() => setSelectedRole(option.value)}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      data-testid={`radio-role-${option.value}`}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.value}
                        className="flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateRoleMutation.isPending}
            data-testid="button-cancel-edit-role"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateRoleMutation.isPending || selectedRole === user.role}
            data-testid="button-save-edit-role"
          >
            {updateRoleMutation.isPending ? "Salvando..." : "Salvar Alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
