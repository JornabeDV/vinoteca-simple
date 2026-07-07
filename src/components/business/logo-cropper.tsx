"use client";

import { useState, useRef } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check } from "lucide-react";

interface LogoCropperProps {
  imageSrc: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (file: File) => void;
}

export function LogoCropper({
  imageSrc,
  open,
  onOpenChange,
  onCropComplete,
}: LogoCropperProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [isCropping, setIsCropping] = useState(false);

  function handleCrop() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsCropping(true);

    try {
      const canvas = cropper.getCroppedCanvas({
        width: 400,
        height: 400,
      });

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "logo.png", { type: "image/png" });
            onCropComplete(file);
          }
          setIsCropping(false);
          onOpenChange(false);
        },
        "image/png",
        0.9
      );
    } catch {
      console.error("Logo crop failed");
      setIsCropping(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Recortar logo</DialogTitle>
          <DialogDescription>
            Ajustá el recuadro para encuadrar el logo. Se guardará en formato cuadrado.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-lg overflow-hidden border border-border/50 bg-muted">
          <Cropper
            ref={cropperRef}
            src={imageSrc}
            style={{ height: 320, width: "100%" }}
            aspectRatio={1}
            initialAspectRatio={1}
            viewMode={1}
            guides={true}
            background={false}
            responsive={true}
            autoCropArea={0.9}
            checkOrientation={false}
            minCropBoxHeight={50}
            minCropBoxWidth={50}
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCropping}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCrop}
            disabled={isCropping}
            className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
          >
            {isCropping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Recortar y usar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
