import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertCertificateSchema, type Client, type CertificateWithRelations } from "@shared/schema";
import { ObjectUploader } from "@/components/object-uploader";
import type { UploadResult } from "@uppy/core";

const formSchema = insertCertificateSchema.extend({
  issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  expiryDate: z.string().min(1, "Data de validade é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

export default function CertificateForm() {
  const params = useParams();
  const certificateId = params.id;
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string>("");

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

  const { data: certificate, isLoading: certLoading } = useQuery<CertificateWithRelations>({
    queryKey: ["/api/certificates", certificateId],
    enabled: !!certificateId && !!user,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: !!user,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      clientId: "",
      issuingAuthority: "",
      issueDate: "",
      expiryDate: "",
      notes: "",
      createdBy: user?.id || "",
    },
  });

  useEffect(() => {
    if (certificate) {
      form.reset({
        type: certificate.type,
        clientId: certificate.clientId,
        issuingAuthority: certificate.issuingAuthority,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        notes: certificate.notes || "",
        createdBy: certificate.createdBy,
      });
      if (certificate.documentUrl) {
        setUploadedDocUrl(certificate.documentUrl);
      }
    }
  }, [certificate, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (certificateId) {
        await apiRequest("PATCH", `/api/certificates/${certificateId}`, data);
      } else {
        await apiRequest("POST", "/api/certificates", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Sucesso",
        description: certificateId ? "Certidão atualizada com sucesso" : "Certidão criada com sucesso",
      });
      window.location.href = "/certificates";
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
        description: "Não foi possível salvar a certidão",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      uploadURL: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      setUploadedDocUrl(uploadURL);
      
      if (certificateId) {
        try {
          await apiRequest("PUT", `/api/certificates/${certificateId}/document`, {
            documentURL: uploadURL,
          });
          toast({
            title: "Documento enviado",
            description: "O PDF foi enviado com sucesso",
          });
        } catch (error) {
          toast({
            title: "Erro",
            description: "Não foi possível vincular o documento",
            variant: "destructive",
          });
        }
      }
    }
  };

  if (authLoading || (certificateId && certLoading)) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" asChild data-testid="button-back">
          <a href="/certificates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-form-title">
            {certificateId ? "Editar Certidão" : "Nova Certidão"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-client">
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Certidão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Federal, Estadual, Municipal" {...field} data-testid="input-type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuingAuthority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Órgão Emissor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Receita Federal" {...field} data-testid="input-issuing-authority" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Emissão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-issue-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Validade</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expiry-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionais..." {...field} data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Documento PDF</h3>
                <div className="flex items-center gap-4">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadedDocUrl ? "Alterar PDF" : "Upload PDF"}
                  </ObjectUploader>
                  {uploadedDocUrl && (
                    <span className="text-sm text-muted-foreground">
                      ✓ PDF enviado
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" asChild data-testid="button-cancel">
                  <a href="/certificates">Cancelar</a>
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save">
                  {saveMutation.isPending ? "Salvando..." : "Salvar Certidão"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
