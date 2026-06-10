"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "¿Necesito conocimientos técnicos para usar VinotecaSimple?",
    answer:
      "No. La plataforma está diseñada para que cualquier persona la use sin capacitación. Si sabés usar WhatsApp o Instagram, sabés usar VinotecaSimple. La interfaz es intuitiva y cada función está pensada para dueños de vinotecas, no para ingenieros.",
  },
  {
    question: "¿Puedo probarlo antes de contratar?",
    answer:
      "Sí. Tenés 14 días de prueba gratuita con acceso completo a todas las funcionalidades. No te pedimos tarjeta de crédito para empezar. Si en esos 14 días no te convence, cancelás y no te cobramos nada.",
  },
  {
    question: "¿Funciona desde el celular?",
    answer:
      "Sí. VinotecaSimple es 100% responsive. Podés registrar ventas, consultar stock y ver métricas desde tu celular, tablet o computadora. Solo necesitás conexión a internet.",
  },
  {
    question: "¿Cuánto tarda la implementación?",
    answer:
      "Podés empezar a usarlo en menos de 5 minutos. Solo creás tu cuenta y empezás a cargar productos. Si tenés un listado en Excel, te ayudamos a importarlo gratis. No hay instalaciones, no hay servers, no hay complicaciones.",
  },
  {
    question: "¿Mis datos están seguros?",
    answer:
      "Sí. Usamos infraestructura cloud de nivel empresarial con encriptación SSL, backups automáticos diarios y cumplimiento de normativas de protección de datos. Tu información es tuya: podés exportarla o eliminarla cuando quieras.",
  },
  {
    question: "¿Puedo cancelar la suscripción cuando quiera?",
    answer:
      "Sí, sin letra chica. Cancelás cuando querés y seguís usando el sistema hasta el final del período pagado. No hay contratos de permanencia ni penalidades por cancelación.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Preguntas frecuentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Todo lo que necesitás saber antes de empezar.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-card border border-border/50 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
