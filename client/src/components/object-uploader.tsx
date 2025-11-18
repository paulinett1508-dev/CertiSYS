import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await onGetUploadParameters();
      const uploadURL = response.url || response.uploadURL;
      
      if (!uploadURL) {
        throw new Error("No upload URL received");
      }
      
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const finalURL = uploadURL.split("?")[0];
      
      onComplete?.({
        successful: [{ uploadURL: finalURL }],
      });

      toast({
        title: "Upload concluído",
        description: "O arquivo foi enviado com sucesso",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        id="file-upload"
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        data-testid="input-file-upload"
      />
      <Button
        type="button"
        onClick={() => document.getElementById("file-upload")?.click()}
        className={buttonClassName}
        disabled={isUploading}
        data-testid="button-open-uploader"
      >
        {isUploading ? "Enviando..." : children}
      </Button>
    </div>
  );
}
