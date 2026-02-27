import { useTranslation } from "@/i18n/LanguageContext";
import { Language, LANGUAGE_LABELS } from "@/i18n/translations";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGS: Language[] = ["en", "my", "zo"];

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-xl p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all flex items-center gap-1.5 text-xs font-medium"
          aria-label="Change language"
        >
          <Globe size={16} />
          <span className="hidden sm:inline">{LANGUAGE_LABELS[language]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`text-sm ${language === lang ? "font-semibold text-primary" : ""}`}
          >
            {LANGUAGE_LABELS[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
