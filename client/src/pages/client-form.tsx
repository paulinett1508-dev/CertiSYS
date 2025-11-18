import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertClientSchema, type Client } from "@shared/schema";
import type { z } from "zod";

type FormData = z.infer<typeof insertClientSchema>;

export default function ClientForm() {
  const params = useParams();
  const clientId = params.id;
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

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId && !!user,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      document: "",
      email: "",
      phone: "",
      createdBy: user?.id || "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        document: client.document,
        email: client.email || "",
        phone: client.phone || "",
        createdBy: client.createdBy,
      });
    }
  }, [client, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (clientId) {
        await apiRequest("PATCH", `/api/clients/${clientId}`, data);
      } else {
        await apiRequest("POST", "/api/clients", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Sucesso",
        description: clientId ? "Cliente atualizado com sucesso" : "Cliente criado com sucesso",
      });
      window.location.href = "/clients";
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
        description: "Não foi possível salvar o cliente",
        variant: "destructive",
      });
    },
  });

  if (authLoading || (clientId && clientLoading)) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" asChild data-testid="button-back">
          <a href="/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-form-title">
            {clientId ? "Editar Cliente" : "Novo Cliente"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome / Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ / CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} data-testid="input-document" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opcional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" asChild data-testid="button-cancel">
                  <a href="/clients">Cancelar</a>
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save">
                  {saveMutation.isPending ? "Salvando..." : "Salvar Cliente"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
