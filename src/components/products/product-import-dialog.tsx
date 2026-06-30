"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { importProducts } from "@/lib/actions";
import {
  parseXlsxFile,
  parseCsvText,
  generateTemplateCsv,
  type ParsedRow,
  type ImportProductRow,
} from "@/lib/import-parser";
import { toast } from "sonner";

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductImportDialog({
  open,
  onOpenChange,
}: ProductImportDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validRows = parsedRows.filter((r) => r.data !== null);
  const invalidRows = parsedRows.filter((r) => r.data === null);

  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true);
    try {
      const rows = await parseXlsxFile(file);
      setParsedRows(rows);
      toast.success(`${rows.length} filas procesadas`);
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el archivo");
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );



  const handleDownloadTemplate = useCallback(() => {
    const csv = generateTemplateCsv();
    const csvWithBom = "\ufeff" + csv;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-productos-vinoteca.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada");
  }, []);

  const handleImport = useCallback(async () => {
    if (validRows.length === 0) {
      toast.error("No hay filas válidas para importar");
      return;
    }

    setIsImporting(true);
    try {
      const items = validRows.map((r) => r.data!);
      const result = await importProducts(items);
      if (result.success) {
        toast.success(`${result.count} productos importados correctamente`);
        setParsedRows([]);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Error al importar");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al importar productos");
    } finally {
      setIsImporting(false);
    }
  }, [validRows, onOpenChange, router]);

  const reset = useCallback(() => {
    setParsedRows([]);
    setIsParsing(false);
    setIsImporting(false);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-5xl sm:max-w-[90vw] h-full max-h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col sm:overflow-y-auto rounded-none sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#7b1f3a]" />
            Importar Productos
          </DialogTitle>
          <DialogDescription>
            Cargá tu inventario desde Excel o CSV. Descargá la plantilla para ver el formato esperado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden sm:block sm:flex-none sm:overflow-visible">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 shrink-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Plantilla
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1">
              <Upload className="h-3.5 w-3.5" />
              Subir archivo
            </TabsTrigger>
          </TabsList>

          {/* Template Tab */}
          <TabsContent value="template" className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <h4 className="font-medium text-sm">Formato esperado</h4>
              <p className="text-sm text-muted-foreground">
                El archivo debe tener una fila de encabezados con estos nombres de columna:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "nombre",
                  "bodega",
                  "categoria",
                  "varietal",
                  "anada",
                  "precio costo",
                  "precio venta",
                  "stock",
                  "stock minimo",
                  "descripcion",
                ].map((col) => (
                  <Badge key={col} variant="secondary" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla CSV
            </Button>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-[#7b1f3a] bg-[#7b1f3a]/5"
                  : "border-border hover:border-[#7b1f3a]/50"
              }`}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Arrastrá tu archivo acá o hacé clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Soporta .xlsx, .xls y .csv
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="import-file-input"
              />
              <label htmlFor="import-file-input">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() =>
                    document.getElementById("import-file-input")?.click()
                  }
                >
                  Seleccionar archivo
                </Button>
              </label>
            </div>
          </TabsContent>


        </Tabs>

        {/* Preview */}
        {parsedRows.length > 0 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Vista previa</span>
                <Badge
                  variant="default"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {validRows.length} válidas
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge
                    variant="default"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {invalidRows.length} con errores
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                Limpiar
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border sm:max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Bodega</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-24">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 20).map((row) => (
                    <TableRow
                      key={row.rowIndex}
                      className={row.data === null ? "bg-red-50/50" : ""}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {row.rowIndex}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.data?.name || row.raw["nombre"] || row.raw["name"] || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.data?.brand || row.raw["bodega"] || row.raw["winery"] || row.raw["brand"] || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.data?.salePrice
                          ? `$${row.data.salePrice.toLocaleString("es-AR")}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.data?.currentStock ?? "—"}
                      </TableCell>
                      <TableCell>
                        {row.data === null ? (
                          <Badge
                            variant="outline"
                            className="border-red-200 bg-red-50 text-red-700 text-xs"
                          >
                            Error
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                          >
                            OK
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {invalidRows.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
                <p className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errores detectados
                </p>
                <ul className="text-xs text-red-600 space-y-1">
                  {invalidRows.slice(0, 5).map((row) => (
                    <li key={row.rowIndex}>
                      Fila {row.rowIndex}: {row.errors.join(", ")}
                    </li>
                  ))}
                  {invalidRows.length > 5 && (
                    <li>...y {invalidRows.length - 5} filas más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="cursor-pointer"
            size="lg"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            size="lg"
            disabled={validRows.length === 0 || isImporting}
            className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 cursor-pointer"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Importar {validRows.length > 0 && `${validRows.length} productos`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
