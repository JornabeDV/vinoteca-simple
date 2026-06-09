"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Search,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

export function SalesPage({ sales }: { sales: any[] }) {
  const [search, setSearch] = useState("");

  const filteredSales = sales.filter((sale) =>
    sale.saleNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ventas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Link href="/ventas/nueva">
          <Button className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2">
            <Plus className="h-4 w-4" />
            Nueva Venta
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No se encontraron ventas
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="group">
                      <TableCell>
                        <span className="font-medium">{sale.saleNumber}</span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(sale.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sale.user?.name || sale.user?.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {sale.items?.length || 0} productos
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(Number(sale.totalAmount))}
                      </TableCell>
                      <TableCell>
                        <Link href={`/ventas/detalle/${sale.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
