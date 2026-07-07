"use client";

import { useState } from "react";
import { Plus, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createEmployeeByOwner } from "@/lib/auth-actions";

export function CreateEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password.length > 100) {
      toast.error("La contraseña no puede superar los 100 caracteres");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error("La contraseña debe tener al menos una mayúscula");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("La contraseña debe tener al menos una minúscula");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("La contraseña debe tener al menos un número");
      return;
    }

    setIsLoading(true);

    try {
      await createEmployeeByOwner({ name, email, password });
      toast.success("Empleado creado correctamente");
      setName("");
      setEmail("");
      setPassword("");
      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el empleado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo empleado
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Nuevo empleado</DialogTitle>
          <DialogDescription>
            Creá una cuenta para un empleado de tu vinoteca.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="emp-name">Nombre completo</Label>
            <Input
              id="emp-name"
              type="text"
              autoComplete="name"
              placeholder="María López"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              type="email"
              autoComplete="email"
              placeholder="empleado@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emp-password">Contraseña temporal</Label>
            <div className="relative">
              <Input
                id="emp-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Crear empleado
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
