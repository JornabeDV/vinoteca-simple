"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Precios", href: "#precios" },
  { label: "Testimonios", href: "#testimonios" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNavbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const scrollTo = (href: string) => {
    setIsOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Mobile hamburger + Desktop nav */}
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger — LEFT side */}
            <div className="lg:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger>
                  <div className="group/button inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#7b1f3a]/20 disabled:pointer-events-none disabled:opacity-50 h-11 w-11 sm:h-9 sm:w-9 hover:bg-accent hover:text-foreground cursor-pointer -ml-2">
                    <Menu className="h-5 w-5" />
                  </div>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-80 p-0">
                  {/* Drawer header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <Image
                        src="/logo_imagen_sin_fondo.png"
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-lg object-contain"
                      />
                      <Image
                        src="/logo_letra_sin_fondo.png"
                        alt="Vinoteca Simple"
                        width={120}
                        height={28}
                        className="h-6 w-auto object-contain"
                      />
                    </div>
                  </div>

                  {/* Drawer body */}
                  <div className="flex flex-col p-5">
                    <nav className="flex flex-col gap-1">
                      {navLinks.map((link) => (
                        <button
                          key={link.href}
                          onClick={() => scrollTo(link.href)}
                          className="text-leftpx-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          {link.label}
                        </button>
                      ))}
                    </nav>

                    <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border">
                      <Button
                        variant="outline"
                        className="border-[#7b1f3a] text-[#7b1f3a] hover:bg-[#7b1f3a]/5 w-full h-11 cursor-pointer"
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/registro");
                        }}
                      >
                        Solicitar demo
                      </Button>
                      <Button
                        className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white w-full h-11 cursor-pointer"
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/registro");
                        }}
                      >
                        Empezar gratis
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo — visible on all screens */}
            <a href="#" className="flex items-center gap-2.5">
              <Image
                src="/logo_letra_sin_fondo.png"
                alt="Vinoteca Simple"
                width={120}
                height={28}
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>

          {/* Desktop nav — center/right */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="outline"
              className="border-[#7b1f3a] text-[#7b1f3a] hover:bg-[#7b1f3a]/5 text-sm h-9"
              onClick={() => router.push("/registro")}
            >
              Solicitar demo
            </Button>
            <Button
              className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white text-sm h-9"
              onClick={() => router.push("/registro")}
            >
              Empezar gratis
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
