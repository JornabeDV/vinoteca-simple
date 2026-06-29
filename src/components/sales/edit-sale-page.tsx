"use client";

import { useState, useMemo } from "react";
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
  Package,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateSale } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  name: string;
  brand: string;
  style: string;
  salePrice: number;
  quantity: number;
  availableStock: number;
  image?: string;
}

export function EditSalePage({
  sale,
  products,
  customers = [],
  userRole,
}: {
  sale: any;
  products: any[];
  customers?: any[];
  userRole?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    sale.customerId || ""
  );
  const [isAccountSale, setIsAccountSale] = useState(!sale.isPaid);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stock ajustado: el stock actual más lo que ya está reservado en esta venta
  const originalQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of sale.items || []) {
      map.set(item.productId, (map.get(item.productId) || 0) + item.quantity);
    }
    return map;
  }, [sale.items]);

  const adjustedProducts = useMemo(() => {
    return products.map((p) => ({
      ...p,
      adjustedStock: p.currentStock + (originalQtyByProduct.get(p.id) || 0),
    }));
  }, [products, originalQtyByProduct]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    return (sale.items || []).map((item: any) => ({
      productId: item.productId,
      name: item.product?.name || "",
      brand: item.product?.brand || "",
      style: item.product?.style || "",
      salePrice: Number(item.unitPrice),
      quantity: item.quantity,
      availableStock:
        (item.product?.currentStock || 0) + item.quantity,
      image: item.product?.image,
    }));
  });

  // Extract unique categories for filter chips
  const categories = useMemo(() => {
    const cats = new Set<string>();
    adjustedProducts.forEach((p) => {
      if (p.status === "ACTIVE" && p.adjustedStock > 0) {
        cats.add(p.category?.name);
      }
    });
    return Array.from(cats).sort();
  }, [adjustedProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return adjustedProducts.filter((p) => {
      if (p.status !== "ACTIVE" || p.adjustedStock <= 0) return false;
      if (selectedCategory && p.category?.name !== selectedCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.style?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adjustedProducts, selectedCategory, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.availableStock) {
          toast.error("Stock insuficiente");
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          style: product.style,
          salePrice: Number(product.salePrice),
          quantity: 1,
          availableStock: product.adjustedStock,
          image: product.image,
        },
      ];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((item) => {
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
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  async function handleSubmit() {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (!session?.user?.id) {
      toast.error("Debes iniciar sesion");
      return;
    }
    if (isAccountSale && !selectedCustomerId) {
      toast.error("Seleccioná un cliente para la cuenta corriente");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSale(sale.id, {
        userId: session.user.id,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        customerId: isAccountSale ? selectedCustomerId : undefined,
        isPaid: !isAccountSale,
      });
      toast.success("Venta actualizada exitosamente");
      router.push("/ventas");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la venta");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Cart Panel Content (reused in desktop + mobile sheet) ───
  const CartContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-4 py-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Tu carrito esta vacio
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Toca un producto para agregarlo
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <Wine className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand}
                  </p>
                  <p className="text-sm font-semibold text-[#7b1f3a]">
                    {formatPrice(item.salePrice * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateQuantity(item.productId, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-7 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => updateQuantity(item.productId, 1)}
                    disabled={item.quantity >= item.availableStock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeFromCart(item.productId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/50 p-4 space-y-3 bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {cartCount} {cartCount === 1 ? "producto" : "productos"}
          </span>
          <span className="font-heading text-2xl font-bold text-[#7b1f3a]">
            {formatPrice(total)}
          </span>
        </div>
        <Button
          size="xl"
          className="w-full"
          disabled={cart.length === 0 || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Check className="mr-2 h-5 w-5" />
          )}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
      {/* ─── LEFT: Product Grid ─── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base"
                autoFocus
              />
            </div>
            <Link
              href="/ventas"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Cancelar
            </Link>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === null
                    ? "bg-[#7b1f3a] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(cat === selectedCategory ? null : cat)
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#7b1f3a] text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {filteredProducts.length} productos disponibles
          </p>
        </div>

        {/* Customer selection */}
        {customers.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex-1 w-full sm:w-auto">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Cliente
              </Label>
              <Select
                value={selectedCustomerId}
                onValueChange={(value) => {
                  setSelectedCustomerId(value || "");
                  if (value && !isAccountSale) setIsAccountSale(true);
                }}
              >
                <SelectTrigger className="w-full sm:w-[280px] bg-background">
                  <SelectValue placeholder="Seleccionar cliente...">
                    {customers.find((c) => c.id === selectedCustomerId)?.name ||
                      "Seleccionar cliente..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Venta de contado</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Checkbox
                id="account-sale"
                checked={isAccountSale}
                onCheckedChange={(checked) => setIsAccountSale(!!checked)}
              />
              <Label htmlFor="account-sale" className="text-sm cursor-pointer">
                Cuenta corriente
              </Label>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No se encontraron productos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find((c) => c.productId === product.id);
                const isLowStock =
                  product.adjustedStock <= product.minStock;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group relative flex flex-col rounded-xl border border-border/50 bg-card p-3 text-left transition-all hover:shadow-md hover:border-[#7b1f3a]/30 active:scale-[0.98]"
                  >
                    {/* Image */}
                    <div className="flex h-24 w-full items-center justify-center rounded-lg bg-muted mb-2 overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Wine className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {product.brand} {product.style ? `· ${product.style}` : ""}
                      </p>
                    </div>

                    {/* Price & Stock */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <span className="text-sm font-bold text-[#7b1f3a]">
                        {formatPrice(Number(product.salePrice))}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {inCart && (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px] bg-[#7b1f3a]/10 text-[#7b1f3a]"
                          >
                            {inCart.quantity}
                          </Badge>
                        )}
                        <span
                          className={`text-[10px] font-medium ${
                            isLowStock
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {product.adjustedStock} u.
                        </span>
                      </div>
                    </div>

                    {/* Low stock indicator */}
                    {isLowStock && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className="h-5 text-[9px] border-amber-200 bg-amber-50 text-amber-700"
                        >
                          Bajo
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Cart (Desktop) ─── */}
      <div className="hidden lg:flex w-[380px] flex-col border-l border-border/50 bg-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-heading text-base font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-[#7b1f3a]" />
            Editar Venta
            {cartCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {cartCount}
              </Badge>
            )}
          </h3>
        </div>
        <CartContent />
      </div>

      {/* ─── MOBILE: Cart Bottom Bar + Sheet ─── */}
      <div className="lg:hidden shrink-0">
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border/50 px-4 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger>
                  <div className="inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#7b1f3a]/20 disabled:pointer-events-none disabled:opacity-50 h-11 gap-2 px-3 border border-input bg-background hover:bg-accent hover:text-foreground cursor-pointer">
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount}
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col">
                  <SheetHeader className="px-4 py-3 border-b border-border/50">
                    <SheetTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-[#7b1f3a]" />
                      Editar Venta
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    <CartContent />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {cartCount} {cartCount === 1 ? "producto" : "productos"}
                </p>
                <p className="font-heading text-lg font-bold text-[#7b1f3a] truncate">
                  {formatPrice(total)}
                </p>
              </div>

              <Button
                size="xl"
                className="shrink-0 bg-[#7b1f3a] hover:bg-[#5a1530] text-white h-11 px-5"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Guardar
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
