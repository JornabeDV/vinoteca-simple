"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Wine,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createSale } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  name: string;
  winery: string;
  salePrice: number;
  quantity: number;
  availableStock: number;
}

export function NewSalePage({ products }: { products: any[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProducts = products.filter(
    (p) =>
      p.status === "ACTIVE" &&
      p.currentStock > 0 &&
      !cart.find((c) => c.productId === p.id) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.winery.toLowerCase().includes(search.toLowerCase()))
  );

  function addToCart(product: any) {
    setCart([
      ...cart,
      {
        productId: product.id,
        name: product.name,
        winery: product.winery,
        salePrice: Number(product.salePrice),
        quantity: 1,
        availableStock: product.currentStock,
      },
    ]);
    setSearch("");
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty < 1) return item;
          if (newQty > item.availableStock) {
            toast.error("Stock insuficiente");
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.productId !== productId));
  }

  const total = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (!session?.user?.id) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSale({
        userId: session.user.id,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      toast.success("Venta registrada exitosamente");
      router.push("/ventas");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar la venta");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-[#7b1f3a]" />
              Buscar Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Escribe para buscar vinos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11"
            />
            {search && (
              <div className="mt-3 space-y-2 max-h-[300px] overflow-auto">
                {activeProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No se encontraron productos
                  </p>
                ) : (
                  activeProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full flex items-center justify-between rounded-lg border border-border/50 p-3 text-left hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Wine className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.winery} · {product.varietal}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatPrice(Number(product.salePrice))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.currentStock}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#7b1f3a]" />
              Productos Seleccionados
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {cart.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Busca y selecciona productos para la venta
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border/50 p-3 sm:p-4 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.winery}
                      </p>
                      <p className="text-sm font-semibold text-[#7b1f3a]">
                        {formatPrice(item.salePrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateQuantity(item.productId, 1)}
                          disabled={item.quantity >= item.availableStock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div>
        <Card className="border-border/50 sticky top-24">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.salePrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-heading text-lg font-semibold">Total</span>
              <span className="font-heading text-xl font-bold text-[#7b1f3a]">
                {formatPrice(total)}
              </span>
            </div>
            <Button
              className="w-full h-11 bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirmar Venta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
