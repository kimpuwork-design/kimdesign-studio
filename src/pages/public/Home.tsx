import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Phone as PhoneIcon,
  Linkedin,
  Download,
  Home as HomeIcon,
  FileText,
  Briefcase,
  Sparkles,
  Link2,
} from "lucide-react";

import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { useSettings } from "@/hooks/useSettings";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "@/i18n/LanguageContext";
import { ArchitectureBusinessJsonLd } from "@/components/JsonLd";
import { ProgressiveImage } from "@/components/media/ProgressiveImage";
import heroPortraitDemo from "@/assets/hero-portrait.jpg";

const ease = [0.22, 1, 0.36, 1] as const;

/** Strip noisy google-search URLs and any bare URLs from prose. */
function cleanProse(text?: string): string {
  if (!text) return "";
  return text
    .replace(/https?:\/\/(www\.)?google\.[^\s]+/gi, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function Home() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { content } = useSiteContent("hero", "about_me");

  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  useSEO({
    title: t("seo_home_title"),
    description: t("seo_home_description"),
  });

  const hero = content.hero ?? {};

  return (
    <div className="bg-background relative overflow-x-hidden">
      <ArchitectureBusinessJsonLd />
      <PublicNav />
      <PortraitHero settings={settings} studioName={studioName} hero={hero} aboutMe={content.about_me ?? {}} t={t} />
      <PublicFooter />
    </div>
  );
}

/* ───────────── PORTRAIT HERO (editorial dark with amber glow) ───────────── */
function PortraitHero({
  settings,
  studioName,
  hero,
  aboutMe,
  t,
}: {
  settings: any;
  studioName: string;
  hero: any;
  aboutMe: any;
  t: (k: string) => string;
}) {
  const portrait = aboutMe?.profile_image_url || settings?.hero_portrait_url || heroPortraitDemo;

  const role =
    settings?.hero_role || hero?.badge || "Architecture & Interior Design Studio";
  const status = settings?.hero_status || "Open to commissions";
  const cvUrl = settings?.cv_url;
  const email = settings?.contact_email;
  const phone = settings?.phone;
  const address = settings?.address;
  const insta = settings?.instagram_url;
  const description = cleanProse(hero?.description);

  const tokens = studioName.trim().split(/\s+/);
  const mid = Math.ceil(tokens.length / 2);
  const line1 = tokens.slice(0, mid).join(" ");
  const line2 = tokens.slice(mid).join(" ");

  const navItems = [
    { icon: HomeIcon, label: "Home", to: "/" },
    { icon: FileText, label: "Summary", to: "/about" },
    { icon: Briefcase, label: "Portfolio", to: "/portfolio" },
    { icon: Sparkles, label: t("nav_services") || "Services", to: "/services" },
    { icon: Link2, label: t("nav_contact") || "Contact", to: "/contact" },
  ];

  return (
    <section className="relative px-4 md:px-6 pt-6 md:pt-8 pb-10 md:pb-14">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] md:rounded-[36px] bg-[#0c0c0e] text-white min-h-[78vh] md:min-h-[86vh] flex flex-col">
        <ProgressiveImage
          src={portrait}
          alt={studioName}
          width={1024}
          height={1536}
          eager
          priority
          aspectRatio="2 / 3"
          onContextMenu={(e) => e.preventDefault()}
          className="absolute inset-y-0 right-0 h-full w-full md:w-[62%] object-cover object-[center_20%] select-none pointer-events-none"
          wrapperClassName="absolute inset-y-0 right-0 h-full w-full md:w-[62%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 72% 38%, rgba(255,153,51,0.45), rgba(255,107,0,0.15) 35%, transparent 65%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0c0c0e] via-[#0c0c0e]/85 md:via-[#0c0c0e]/60 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-[#0c0c0e]/90 to-transparent"
        />

        <div className="relative z-10 flex items-start justify-between p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/80"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            {status}
          </motion.div>

          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-neutral-900 px-4 py-2 text-[12px] font-semibold tracking-tight shadow-lg shadow-amber-500/20 hover:bg-amber-300 transition-colors"
            >
              <Download size={14} />
              {t("home_download_cv") || "Download CV"}
            </a>
          )}
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-end px-6 md:px-12 pb-28 md:pb-32">
          <div className="overflow-hidden mb-3">
            <motion.p
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-amber-400 text-[13px] md:text-[15px] tracking-[0.04em] font-medium block whitespace-pre-line"
            >
              {"'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            remove all demo pictures, texts"}
            </motion.p>
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            className="font-display font-bold leading-[0.88] tracking-[-0.04em] text-[clamp(2.4rem,9vw,8rem)]"
          >
            <div className="overflow-hidden">
              <motion.span 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="block"
              >
                {line1}
              </motion.span>
            </div>
            {line2 && (
              <div className="overflow-hidden mt-[-0.1em]">
                <motion.span 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  {line2}
                </motion.span>
              </div>
            )}
          </motion.h1>

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="mt-6 max-w-md text-white/70 text-sm md:text-base leading-relaxed"
            >
              {description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 max-w-2xl text-[13px] text-white/85"
          >
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 hover:text-amber-300 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <Mail size={13} />
                </span>
                <span className="truncate">{email}</span>
              </a>
            )}
            {insta && (
              <a
                href={insta}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-amber-300 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <Linkedin size={13} />
                </span>
                <span className="truncate">{insta.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 hover:text-amber-300 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <PhoneIcon size={13} />
                </span>
                <span>{phone}</span>
              </a>
            )}
            {address && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-amber-400/15 text-amber-400">
                  <MapPin size={13} />
                </span>
                <span className="truncate">{address}</span>
              </div>
            )}
          </motion.div>
        </div>

        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
          className="absolute left-1/2 -translate-x-1/2 bottom-5 md:bottom-8 z-10 flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 p-1 shadow-2xl"
        >
          {navItems.map((it, i) => (
            <Link
              key={it.label}
              to={it.to}
              className={`group inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-[12px] tracking-tight transition-colors ${
                i === 0
                  ? "bg-white text-neutral-900 font-medium"
                  : "text-white/85 hover:text-white hover:bg-white/10"
              }`}
            >
              <it.icon size={13} />
              <span className="hidden sm:inline">{it.label}</span>
            </Link>
          ))}
        </motion.nav>
      </div>
    </section>
  );
}
