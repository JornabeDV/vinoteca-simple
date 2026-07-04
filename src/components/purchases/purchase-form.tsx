"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createPurchase, updatePurchase } from "@/lib/purchase-actions";
import { formatPrice } from "@/lib/utils";
import { ProductCombobox } from "@/components/inventory/product-combobox";
import { DatePicker } from "@/components/ui/date-picker";

interface PurchaseFormProps {
  suppliers: any[];
  products: any[];
  purchase?: any;
}

interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
}

function toDateInputValue(date: string | Date | undefined) {
  if (!date) return new Date().toISOString().split("T")[0];
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

export function PurchaseForm({ suppliers, products, purchase }: PurchaseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [supplierId, setSupplierId] = useState<string>(purchase?.supplierId || "");
  const [invoiceNumber, setInvoiceNumber] = useState(purchase?.invoiceNumber || "");
  const [purchaseDate, setPurchaseDate] = useState<string>(
    toDateInputValue(purchase?.purchaseDate)
  );
  const [notes, setNotes] = useState(purchase?.notes || "");
  const [isPaid, setIsPaid] = useState(purchase?.isPaid || false);
  const [paymentMethod, setPaymentMethod] = useState(purchase?.payments?.[0]?.paymentMethod || "");
  const [paymentDate, setPaymentDate] = useState<string>(
    toDateInputValue(purchase?.payments?.[0]?.paymentDate || purchase?.purchaseDate)
  );
  const [items, setItems] = useState<PurchaseItem[]>(
    purchase?.items?.length
      ? purchase.items.map((i: any) => ({
          id: crypto.randomUUID(),
          productId: i.productId,
          quantity: i.quantity,
          unitCost: Number(i.unitCost),
        }))
      : [{ id: crypto.randomUUID(), productId: "", quantity: 1, unitCost: 0 }]
  );

  const activeProducts = products.filter((p) => p.status === "ACTIVE");

  const total = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0),
    0
  );

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: "", quantity: 1, unitCost: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof PurchaseItem, value: any) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    if (!supplierId) {
      toast.error("Seleccioná un proveedor");
      setIsLoading(false);
      return;
    }

    const validItems = items.filter(
      (i) => i.productId && i.quantity > 0 && i.unitCost > 0
    );
    if (validItems.length === 0) {
      toast.error("Agregá al menos un producto válido");
      setIsLoading(false);
      return;
    }

    try {
      if (purchase) {
        await updatePurchase(purchase.id, {
          supplierId,
          invoiceNumber: invoiceNumber || undefined,
          purchaseDate: new Date(purchaseDate),
          notes: notes || undefined,
          isPaid,
          paymentMethod: paymentMethod || undefined,
          paymentDate: isPaid ? new Date(paymentDate) : undefined,
          items: validItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        });
        toast.success("Compra actualizada");
      } else {
        await createPurchase({
          supplierId,
          invoiceNumber: invoiceNumber || undefined,
          purchaseDate: new Date(purchaseDate),
          notes: notes || undefined,
          isPaid,
          paymentMethod: paymentMethod || undefined,
          paymentDate: isPaid ? new Date(paymentDate) : undefined,
          items: validItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        });
        toast.success("Compra registrada");
      }
      router.push("/compras");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || `Error al ${purchase ? "actualizar" : "registrar"} la compra`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
              <ShoppingBag className="h-5 w-5 text-[#7b1f3a]" />
            </div>
            <h3 className="font-heading text-lg font-semibold">
              {purchase ? "Editar compra" : "Nueva compra"}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Proveedor *</Label>
              <Select value={supplierId} onValueChange={(v) => setSupplierId(v || "")}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Seleccionar proveedor">
                    {suppliers.find((s) => s.id === supplierId)?.name || "Seleccionar proveedor"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de factura / remito</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ej: 001-00001234"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchaseDate">Fecha de compra</Label>
              <DatePicker
                id="purchaseDate"
                date={purchaseDate}
                onChange={setPurchaseDate}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-border/50">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-semibold">Productos</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 rounded-lg border border-border/50 bg-muted/20"
              >
                <div className="sm:col-span-5 space-y-2">
                  <Label className="text-xs">Producto *</Label>
                  <ProductCombobox
                    products={activeProducts}
                    value={item.productId}
                    onChange={(v) => updateItem(item.id, "productId", v)}
                    placeholder="Seleccionar producto"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label className="text-xs">Cantidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, "quantity", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="sm:col-span-3 space-y-2">
                  <Label className="text-xs">Costo unitario *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitCost}
                    onChange={(e) =>
                      updateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="sm:col-span-1 space-y-2">
                  <Label className="text-xs">Subtotal</Label>
                  <p className="text-sm font-medium py-2">{formatPrice(item.quantity * item.unitCost)}</p>
                </div>
                <div className="sm:col-span-1 pb-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-border/50 pt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-heading text-2xl font-bold text-[#7b1f3a]">{formatPrice(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card className="border-border/50">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-base font-semibold">Pago</h3>

          <div className="flex items-center gap-3">
            <Checkbox
              id="isPaid"
              checked={isPaid}
              onCheckedChange={(checked) => setIsPaid(!!checked)}
            />
            <Label htmlFor="isPaid" className="cursor-pointer">
              Se pagó en el momento
            </Label>
          </div>

          {isPaid ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de pago</Label>
                <Input
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Ej: Transferencia"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="paymentDate">Fecha de pago</Label>
                <DatePicker
                  id="paymentDate"
                  date={paymentDate}
                  onChange={setPaymentDate}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Al guardar se generará una deuda en el proveedor por {formatPrice(total)}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex max-sm:flex-col max-sm:items-center sm:justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          size="xl"
          onClick={() => router.push("/compras")}
          disabled={isLoading}
          className="max-sm:w-full"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          size="xl"
          className="max-sm:w-full bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : purchase ? (
            "Guardar cambios"
          ) : (
            "Guardar compra"
          )}
        </Button>
      </div>
    </form>
  );
}
