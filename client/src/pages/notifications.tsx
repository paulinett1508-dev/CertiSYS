import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { formatRelativeTime, getNotificationDateGroup } from "@/lib/dateUtils";
import type { NotificationWithRelations } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Notifications() {
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

  const { data: notifications, isLoading } = useQuery<NotificationWithRelations[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}`, { isRead: "true" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você será redirecionado para fazer login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você será redirecionado para fazer login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive",
      });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => n.isRead === "false").length || 0;

  const groupedNotifications = notifications?.reduce((groups, notif) => {
    const group = getNotificationDateGroup(notif.createdAt!);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notif);
    return groups;
  }, {} as Record<string, NotificationWithRelations[]>) || {};

  const groupOrder: Array<'Hoje' | 'Ontem' | 'Esta Semana' | 'Anterior'> = ['Hoje', 'Ontem', 'Esta Semana', 'Anterior'];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-notifications-title">
            Notificações
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} {unreadCount === 1 ? "notificação não lida" : "notificações não lidas"}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhuma notificação no momento</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((groupName) => {
            const groupNotifs = groupedNotifications[groupName];
            if (!groupNotifs || groupNotifs.length === 0) return null;

            return (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle className="text-lg">{groupName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border ${
                        notif.isRead === "false" ? "bg-accent/50" : ""
                      } hover-elevate`}
                      data-testid={`notification-${notif.id}`}
                    >
                      <div className="mt-1">
                        <Bell className={`h-5 w-5 ${notif.isRead === "false" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={notif.isRead === "false" ? "font-medium" : ""}>
                          {notif.message}
                        </p>
                        {notif.certificate && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Cliente: {notif.certificate.client.name} • Tipo: {notif.certificate.type}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatRelativeTime(notif.createdAt!)}
                        </p>
                      </div>
                      {notif.isRead === "false" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(notif.id)}
                          disabled={markAsReadMutation.isPending}
                          data-testid={`button-mark-read-${notif.id}`}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
