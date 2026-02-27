import { useState } from "react";
import { MessageCircle, X, Phone } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const phone = settings?.phone?.replace(/[^0-9+]/g, "") ?? "";

  const channels = [
    {
      label: "Viber",
      icon: () => <Phone size={18} />,
      href: phone ? `viber://chat?number=${encodeURIComponent(phone)}` : "#",
      color: "bg-[#7360f2]",
    },
    {
      label: "WhatsApp",
      icon: () => <MessageCircle size={18} />,
      href: phone ? `https://wa.me/${phone.replace("+", "")}` : "#",
      color: "bg-[#25D366]",
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Channel bubbles */}
      {open && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 rounded-2xl ${ch.color} text-white px-5 py-3 shadow-lg hover:scale-105 transition-transform duration-200`}
            >
              <ch.icon />
              <span className="text-sm font-medium">{ch.label}</span>
            </a>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Contact us"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
