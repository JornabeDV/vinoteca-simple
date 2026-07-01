import * as XLSX from "xlsx";

export interface ImportProductRow {
  name: string;
  brand: string;
  category: string;
  style: string;
  year?: number | null;
  productType: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  description?: string;
}

export interface ParsedRow {
  rowIndex: number;
  data: ImportProductRow | null;
  errors: string[];
  raw: Record<string, string | number | undefined>;
}

// Flexible column name mapping (Spanish / English / variations)
const COLUMN_MAP: Record<string, keyof ImportProductRow> = {
  // name
  nombre: "name",
  name: "name",
  producto: "name",
  // brand (was winery)
  bodega: "brand",
  winery: "brand",
  productor: "brand",
  brand: "brand",
  marca: "brand",
  // category
  categoria: "category",
  category: "category",
  tipo: "category",
  // style (was varietal)
  varietal: "style",
  uva: "style",
  grape: "style",
  style: "style",
  estilo: "style",
  // year (was vintage)
  anada: "year",
  vintage: "year",
  year: "year",
  año: "year",
  // productType
  "tipo producto": "productType",
  producttype: "productType",
  "product type": "productType",
  tipo_producto: "productType",
  // costPrice
  "precio costo": "costPrice",
  precio_costo: "costPrice",
  costprice: "costPrice",
  "cost price": "costPrice",
  costo: "costPrice",
  // salePrice
  "precio venta": "salePrice",
  precio_venta: "salePrice",
  saleprice: "salePrice",
  "sale price": "salePrice",
  precio: "salePrice",
  // currentStock
  stock: "currentStock",
  currentstock: "currentStock",
  "current stock": "currentStock",
  "stock actual": "currentStock",
  cantidad: "currentStock",
  // minStock
  "stock minimo": "minStock",
  stock_minimo: "minStock",
  minstock: "minStock",
  "min stock": "minStock",
  minimo: "minStock",
  // description
  descripcion: "description",
  description: "description",
  notas: "description",
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]): Record<string, keyof ImportProductRow> {
  const mapping: Record<string, keyof ImportProductRow> = {};
  for (const h of headers) {
    const normalized = normalizeHeader(h);
    if (COLUMN_MAP[normalized]) {
      mapping[h] = COLUMN_MAP[normalized];
    }
  }
  return mapping;
}

function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value).replace(/\./g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseInteger(value: string | number | undefined): number | null {
  const num = parseNumber(value);
  if (num === null) return null;
  const int = Math.floor(num);
  return int;
}

function validateRow(row: ImportProductRow, rowIndex: number): ParsedRow {
  const errors: string[] = [];

  if (!row.name || row.name.trim() === "") errors.push("El nombre es obligatorio");
  if (!row.brand || row.brand.trim() === "") errors.push("La bodega/marca es obligatoria");
  if (!row.category || row.category.trim() === "") errors.push("La categoría es obligatoria");
  if (!row.style || row.style.trim() === "") errors.push("El varietal/estilo es obligatorio");
  if (row.costPrice === undefined || row.costPrice === null || row.costPrice <= 0)
    errors.push("El precio de costo debe ser mayor a 0");
  if (row.salePrice === undefined || row.salePrice === null || row.salePrice <= 0)
    errors.push("El precio de venta debe ser mayor a 0");
  if (row.currentStock === undefined || row.currentStock === null || row.currentStock < 0)
    errors.push("El stock actual no puede ser negativo");
  if (row.minStock === undefined || row.minStock === null || row.minStock < 0)
    errors.push("El stock mínimo no puede ser negativo");

  return {
    rowIndex,
    data: errors.length === 0 ? row : null,
    errors,
    raw: row as unknown as Record<string, string | number | undefined>,
  };
}

export function parseImportData(
  rawRows: Record<string, string | number | undefined>[]
): ParsedRow[] {
  if (rawRows.length === 0) return [];

  const headers = Object.keys(rawRows[0]);
  const mapping = mapHeaders(headers);

  return rawRows.map((rawRow, idx) => {
    const row: Partial<ImportProductRow> = {};

    for (const [header, field] of Object.entries(mapping)) {
      const value = rawRow[header];
      if (field === "year") {
        row[field] = parseInteger(value) ?? null;
      } else if (field === "costPrice" || field === "salePrice") {
        row[field] = parseNumber(value) ?? 0;
      } else if (field === "currentStock" || field === "minStock") {
        row[field] = parseInteger(value) ?? 0;
      } else {
        row[field] = value !== undefined ? String(value).trim() : undefined;
      }
    }

    // Provide defaults for missing optional fields
    const completeRow: ImportProductRow = {
      name: row.name ?? "",
      brand: row.brand ?? "",
      category: row.category ?? "",
      style: row.style ?? "",
      year: row.year ?? null,
      productType: row.productType ?? "WINE",
      costPrice: row.costPrice ?? 0,
      salePrice: row.salePrice ?? 0,
      currentStock: row.currentStock ?? 0,
      minStock: row.minStock ?? 0,
      description: row.description,
    };

    return validateRow(completeRow, idx + 2); // +2 because row 1 is header
  });
}

export function parseXlsxFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string | number | undefined>>(
          firstSheet,
          { defval: "" }
        );
        resolve(parseImportData(json));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsArrayBuffer(file);
  });
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.substring(1) : text;
}

export function parseCsvText(text: string): ParsedRow[] {
  const cleanText = stripBom(text);
  const workbook = XLSX.read(cleanText, { type: "string" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string | number | undefined>>(
    firstSheet,
    { defval: "" }
  );
  return parseImportData(json);
}

export function generateTemplateCsv(): string {
  const headers = [
    "nombre",
    "bodega",
    "categoria",
    "varietal",
    "anada",
    "tipo producto",
    "precio costo",
    "precio venta",
    "stock",
    "stock minimo",
    "descripcion",
  ];
  const example = [
    "Malbec Reserva",
    "Rutini",
    "Vino Tinto",
    "Malbec",
    "2020",
    "VINO",
    "15000",
    "25000",
    "24",
    "5",
    "Notas de ciruela y vainilla",
  ];
  return [headers.join(","), example.join(",")].join("\n");
}
