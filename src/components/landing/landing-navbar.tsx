"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wine, Menu, X } from "lucide-react";
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
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:w-80 p-0">
                  {/* Drawer header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7b1f3a]">
                        <Wine className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
                        Vinoteca <span className="text-[#7b1f3a]">Simple</span>
                      </span>
                    </div>
                  </div>

                  {/* Drawer body */}
                  <div className="flex flex-col p-5">
                    <nav className="flex flex-col gap-1">
                      {navLinks.map((link) => (
                        <button
                          key={link.href}
                          onClick={() => scrollTo(link.href)}
                          className="text-left px-3 py-3 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                        >
                          {link.label}
                        </button>
                      ))}
                    </nav>

                    <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-border">
                      <Button
                        variant="outline"
                        className="border-[#7b1f3a] text-[#7b1f3a] hover:bg-[#7b1f3a]/5 w-full h-11"
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/registro");
                        }}
                      >
                        Solicitar demo
                      </Button>
                      <Button
                        className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white w-full h-11"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7b1f3a]">
                <Wine className="h-4 w-4 text-white" />
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
                Vinoteca <span className="text-[#7b1f3a]">Simple</span>
              </span>
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
