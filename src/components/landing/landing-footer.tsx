"use client";

import { Wine } from "lucide-react";

const footerLinks = [
  {
    title: "Producto",
    links: [
      { label: "Funcionalidades", href: "#funcionalidades" },
      { label: "Beneficios", href: "#beneficios" },
      { label: "Precios", href: "#precios" },
      { label: "Registrate", href: "/registro" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Centro de ayuda", href: "#" },
      { label: "Contacto", href: "#" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos de servicio", href: "#" },
      { label: "Privacidad", href: "#" },
      { label: "Seguridad", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7b1f3a]">
                <Wine className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
                Vinoteca <span className="text-[#7b1f3a]">Simple</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              La forma más simple de administrar tu vinoteca. Controlá stock, registrá ventas y tomá mejores decisiones.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 Vinoteca Simple. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            San Juan, Argentina
          </p>
        </div>
      </div>
    </footer>
  );
}
