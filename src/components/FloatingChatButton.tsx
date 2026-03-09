import { useState } from "react";
import { MessageCircle, X, Phone } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const { t } = useTranslation();
  const phone = settings?.phone?.replace(/[^0-9+]/g, "") ?? "";

  const channels = [
    {
      label: t("chat_viber"),
      icon: Phone,
      href: phone ? `viber://chat?number=${encodeURIComponent(phone)}` : "#",
      color: "bg-[#7360f2] hover:bg-[#6050e0]",
    },
    {
      label: t("chat_whatsapp"),
      icon: MessageCircle,
      href: phone ? `https://wa.me/${phone.replace("+", "")}` : "#",
      color: "bg-[#25D366] hover:bg-[#1ebe5a]",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Channel bubbles */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            {channels.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <motion.a
                  key={ch.label}
                  href={ch.href}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{
                    duration: 0.35,
                    delay: i * 0.08,
                    ease,
                  }}
                  whileHover={{ scale: 1.05, x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 rounded-full ${ch.color} text-white px-5 py-3 shadow-lg transition-colors duration-200`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{ch.label}</span>
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center relative"
        aria-label="Contact us"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.25, ease }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.25, ease }}
            >
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: "3s" }} />
        )}
      </motion.button>
    </div>
  );
}
