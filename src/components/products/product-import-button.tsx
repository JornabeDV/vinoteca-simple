"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImportDialog } from "./product-import-dialog";

export function ProductImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className="gap-2"
        data-tour="productos-importar"
      >
        <Upload className="h-4 w-4" />
        Importar
      </Button>
      <ProductImportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
