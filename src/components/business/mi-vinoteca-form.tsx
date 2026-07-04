"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Store, Trash2, Upload, ImageIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateBusiness, uploadLogoToCloudinary } from "@/lib/auth-actions";
import { LogoCropper } from "./logo-cropper";

interface MiVinotecaFormProps {
  business: {
    id: string;
    name: string;
    logo: string | null;
    inviteCode: string;
  };
}

export function MiVinotecaForm({ business }: MiVinotecaFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(business.name);
  const [logoUrl, setLogoUrl] = useState<string | null>(business.logo);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const displayUrl = previewUrl || logoUrl;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato no válido. Usá PNG, JPG, WEBP o SVG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropperImage(objectUrl);
  }

  function handleCropComplete(croppedFile: File) {
    setPendingFile(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedFile));
    setCropperImage(null);
  }

  function handleRemoveLogo() {
    setLogoUrl(null);
    setPendingFile(null);
    setPreviewUrl(null);
    setCropperImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalLogo = logoUrl;

      if (pendingFile) {
        const formData = new FormData();
        formData.set("logo", pendingFile);
        const uploadResult = await uploadLogoToCloudinary(formData);
        finalLogo = uploadResult.url;
      }

      await updateBusiness({ name: name.trim(), logo: finalLogo });
      toast.success("Vinoteca actualizada correctamente");

      // Limpiar preview local y actualizar con la URL definitiva
      setPendingFile(null);
      setPreviewUrl(null);
      setLogoUrl(finalLogo);

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la vinoteca");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Store className="h-5 w-5 text-[#7b1f3a]" />
            Datos de la vinoteca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la vinoteca *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: La Barrica"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-3">
            <Label>Logo</Label>

            {displayUrl ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative h-32 w-32 rounded-xl border border-border/50 overflow-hidden bg-muted shadow-sm">
                  <img
                    src={displayUrl}
                    alt="Logo de la vinoteca"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Cambiar logo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Quitar logo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir logo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Formatos permitidos: PNG, JPG, WEBP, SVG. Máximo 2 MB.
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-[#7b1f3a]" />
            Vista previa en el menú
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-6">
            {displayUrl ? (
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-[#7b1f3a]/10 bg-muted shadow-sm">
                <img
                  src={displayUrl}
                  alt={name || "Vinoteca"}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7b1f3a] text-[#faf9f7] font-heading font-bold text-xl shadow-sm">
                  {name
                    ? name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "VS"}
                </div>
                <span className="font-heading text-base font-semibold text-foreground truncate max-w-full">
                  {name || "Vinoteca Simple"}
                </span>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Así se verá tu vinoteca en el menú lateral. Un logo claro y legible ayuda a que tu equipo se sienta en casa.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>

      {cropperImage && (
        <LogoCropper
          imageSrc={cropperImage}
          open={!!cropperImage}
          onOpenChange={(open) => {
            if (!open) {
              setCropperImage(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </form>
  );
}
