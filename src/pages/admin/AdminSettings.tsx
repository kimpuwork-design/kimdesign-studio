import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSettings, uploadPortfolioImage } from "@/lib/portfolio";
import { writeAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, X, User, Lock, Palette, Phone, Globe, Accessibility } from "lucide-react";
import { AvatarUpload } from "@/components/admin/AvatarUpload";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { motion, AnimatePresence } from "framer-motion";

const SETTINGS_TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "social", label: "Social", icon: Globe },
];

export default function AdminSettings() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const { reduceMotion, setReduceMotion } = useAccessibility();

  const [fullName, setFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) setFullName(profile.full_name ?? "");
    if (user) setNewEmail(user.email ?? "");
  }, [profile, user]);

  useEffect(() => {
    supabase.from("settings").select("*").maybeSingle().then(({ data }) => {
      if (data) setSettings(data as StudioSettings);
    });
  }, []);

  const set = (k: keyof StudioSettings, v: string | null) =>
    setSettings((s) => s ? { ...s, [k]: v } : s);

  const handleLogoUpload = async (file: File) => {
    if (!settings) return;
    setLogoUploading(true);
    const path = `logos/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setLogoUploading(false); return; }
    const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
    set("logo_url", data.publicUrl);
    setLogoUploading(false);
  };

  const handlePortraitUpload = async (file: File) => {
    if (!settings) return;
    setLogoUploading(true);
    const path = `hero/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setLogoUploading(false); return; }
    const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
    set("hero_portrait_url", data.publicUrl);
    setLogoUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !profile) return;
    setSaving(true);
    const { error } = await supabase.from("settings").update({
      studio_name: settings.studio_name,
      contact_email: settings.contact_email,
      logo_url: settings.logo_url,
      tagline: settings.tagline,
      phone: settings.phone,
      address: settings.address,
      facebook_url: settings.facebook_url,
      instagram_url: settings.instagram_url,
      behance_url: settings.behance_url,
      hero_portrait_url: settings.hero_portrait_url ?? null,
      hero_role: settings.hero_role ?? null,
      hero_status: settings.hero_status ?? null,
      cv_url: settings.cv_url ?? null,
    }).eq("id", settings.id);


    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ actor_id: profile.id, action: "settings_updated", entity_type: "settings", entity_id: settings.id });
    toast({ title: "Settings saved ✓" });
  };

  const handleSaveAccount = async () => {
    if (!profile) return;
    setSavingAccount(true);
    const { error: profileErr } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
    if (profileErr) { toast({ title: "Failed to update name", variant: "destructive" }); setSavingAccount(false); return; }
    if (newEmail && newEmail !== user?.email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email: newEmail });
      if (emailErr) { toast({ title: "Failed to update email", description: emailErr.message, variant: "destructive" }); setSavingAccount(false); return; }
    }
    setSavingAccount(false);
    toast({ title: "Account updated ✓" });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) { toast({ title: "Failed to change password", description: error.message, variant: "destructive" }); return; }
    setNewPassword(""); setConfirmPassword("");
    toast({ title: "Password changed ✓" });
  };

  return (
    <PortalLayout variant="admin">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 md:mb-8">
        <h1 className="font-display text-xl md:text-3xl font-bold text-portal-text">Settings</h1>
        <p className="mt-1 text-xs md:text-base text-portal-text-muted">Studio branding, contact info, account, and social links.</p>
      </motion.div>

      {/* Tab Navigation — horizontal scroll on mobile */}
      <div className="flex gap-0.5 md:gap-1 mb-4 md:mb-6 bg-portal-bg/50 rounded-xl p-1 border border-portal-border/50 overflow-x-auto scrollbar-none max-w-full md:max-w-fit">
        {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
              activeTab === id
                ? "bg-portal-accent text-portal-accent-foreground shadow-sm"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface/50"
            }`}>
            <Icon size={13} className="md:w-[14px] md:h-[14px]" />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="max-w-2xl px-0"
        >
          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider flex items-center gap-2">
                  <User size={14} className="text-portal-accent" /> Profile
                </h2>
                <AvatarUpload />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-portal-text-muted text-xs">Display Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="bg-portal-bg border-portal-border text-portal-text" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-portal-text-muted text-xs">Email</Label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-portal-bg border-portal-border text-portal-text" />
                  </div>
                </div>
                <Button onClick={handleSaveAccount} disabled={savingAccount} size="sm"
                  className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                  {savingAccount ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Account"}
                </Button>
              </div>

              <div className="glass-card p-6 space-y-4">
                <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider flex items-center gap-2">
                  <Lock size={14} className="text-portal-accent" /> Change Password
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-portal-text-muted text-xs">New Password</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters" className="bg-portal-bg border-portal-border text-portal-text" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-portal-text-muted text-xs">Confirm Password</Label>
                    <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password" className="bg-portal-bg border-portal-border text-portal-text" />
                  </div>
                </div>
                <Button onClick={handleChangePassword} disabled={savingPassword} size="sm"
                  className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                  {savingPassword ? <><Loader2 size={14} className="animate-spin mr-2" />Changing…</> : "Change Password"}
                </Button>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === "branding" && (
            !settings ? (
              <div className="flex items-center gap-2 py-10 text-portal-text-muted">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider flex items-center gap-2">
                    <Palette size={14} className="text-portal-accent" /> Branding
                  </h2>
                  <div>
                    <Label className="text-portal-text-muted text-xs mb-2 block">Logo</Label>
                    <div className="flex items-center gap-4 flex-wrap">
                      {settings.logo_url && (
                        <div className="relative">
                          <img src={settings.logo_url} alt="Logo" className="h-14 w-auto rounded-lg object-contain bg-portal-bg border border-portal-border p-1" />
                          <button type="button" onClick={() => set("logo_url", null)}
                            className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-white">
                            <X size={10} />
                          </button>
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-xs text-portal-text-muted hover:border-portal-accent/50 hover:text-portal-text transition-colors">
                        {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        {logoUploading ? "Uploading…" : "Upload Logo"}
                        <input type="file" accept="image/*" className="sr-only"
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                      </label>
                      <Input value={settings.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value || null)}
                        placeholder="https://…" className="flex-1 min-w-[160px] bg-portal-bg border-portal-border text-portal-text text-xs" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-portal-text-muted text-xs">Studio Name *</Label>
                      <Input value={settings.studio_name} onChange={(e) => set("studio_name", e.target.value)}
                        className="bg-portal-bg border-portal-border text-portal-text" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-portal-text-muted text-xs">Tagline</Label>
                      <Input value={settings.tagline ?? ""} onChange={(e) => set("tagline", e.target.value || null)}
                        placeholder="We create visual stories that matter"
                        className="bg-portal-bg border-portal-border text-portal-text" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider flex items-center gap-2">
                    <Palette size={14} className="text-portal-accent" /> Landing Hero
                  </h2>
                  <div>
                    <Label className="text-portal-text-muted text-xs mb-2 block">Hero Portrait Image</Label>
                    <div className="flex items-center gap-4 flex-wrap">
                      {settings.hero_portrait_url && (
                        <div className="relative">
                          <img src={settings.hero_portrait_url} alt="Hero" className="h-20 w-16 rounded-lg object-cover bg-portal-bg border border-portal-border" />
                          <button type="button" onClick={() => set("hero_portrait_url", null)}
                            className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-white">
                            <X size={10} />
                          </button>
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-xs text-portal-text-muted hover:border-portal-accent/50 hover:text-portal-text transition-colors">
                        {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        {logoUploading ? "Uploading…" : "Upload Portrait"}
                        <input type="file" accept="image/*" className="sr-only"
                          onChange={(e) => e.target.files?.[0] && handlePortraitUpload(e.target.files[0])} />
                      </label>
                      <Input value={settings.hero_portrait_url ?? ""} onChange={(e) => set("hero_portrait_url", e.target.value || null)}
                        placeholder="https://…" className="flex-1 min-w-[160px] bg-portal-bg border-portal-border text-portal-text text-xs" />
                    </div>
                    <p className="text-[11px] text-portal-text-muted mt-2">Recommended: portrait orientation, dark background with rim light, ~1024×1536.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-portal-text-muted text-xs">Role / Subtitle</Label>
                      <Input value={settings.hero_role ?? ""} onChange={(e) => set("hero_role", e.target.value || null)}
                        placeholder="Architecture & Interior Design Studio"
                        className="bg-portal-bg border-portal-border text-portal-text" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-portal-text-muted text-xs">Status Badge</Label>
                      <Input value={settings.hero_status ?? ""} onChange={(e) => set("hero_status", e.target.value || null)}
                        placeholder="Open to commissions"
                        className="bg-portal-bg border-portal-border text-portal-text" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-portal-text-muted text-xs">CV / Portfolio Download URL</Label>
                      <Input value={settings.cv_url ?? ""} onChange={(e) => set("cv_url", e.target.value || null)}
                        placeholder="https://…/cv.pdf"
                        className="bg-portal-bg border-portal-border text-portal-text" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider flex items-center gap-2">
                    <Accessibility size={14} className="text-portal-accent" /> Motion & Accessibility
                  </h2>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label className="text-portal-text text-sm">Reduce Motion</Label>
                      <p className="text-xs text-portal-text-muted">Disable blur, scale and complex transitions for a simpler UI.</p>
                    </div>
                    <Switch 
                      checked={reduceMotion} 
                      onCheckedChange={setReduceMotion}
                      className="data-[state=checked]:bg-portal-accent"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                  {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Branding"}
                </Button>
              </form>
            )
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            !settings ? (
              <div className="flex items-center gap-2 py-10 text-portal-text-muted">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider flex items-center gap-2">
                    <Phone size={14} className="text-portal-accent" /> Contact Info
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-portal-text-muted text-xs">Email *</Label>
                      <Input type="email" value={settings.contact_email} onChange={(e) => set("contact_email", e.target.value)}
                        className="bg-portal-bg border-portal-border text-portal-text" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-portal-text-muted text-xs">Phone</Label>
                      <Input value={settings.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)}
                        placeholder="+1 (555) 000-0000" className="bg-portal-bg border-portal-border text-portal-text" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-portal-text-muted text-xs">Address</Label>
                      <Input value={settings.address ?? ""} onChange={(e) => set("address", e.target.value || null)}
                        placeholder="123 Creative St, New York, NY" className="bg-portal-bg border-portal-border text-portal-text" />
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                  {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Contact"}
                </Button>
              </form>
            )
          )}

          {/* Social Tab */}
          {activeTab === "social" && (
            !settings ? (
              <div className="flex items-center gap-2 py-10 text-portal-text-muted">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="glass-card p-6 space-y-4">
                  <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} className="text-portal-accent" /> Social Links
                  </h2>
                  <div className="grid gap-4">
                    {[
                      { key: "instagram_url" as const, label: "Instagram", placeholder: "https://instagram.com/…" },
                      { key: "behance_url" as const, label: "Behance", placeholder: "https://behance.net/…" },
                      { key: "facebook_url" as const, label: "Facebook", placeholder: "https://facebook.com/…" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-portal-text-muted text-xs">{label}</Label>
                        <Input value={settings[key] ?? ""} onChange={(e) => set(key, e.target.value || null)}
                          placeholder={placeholder} className="bg-portal-bg border-portal-border text-portal-text text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
                  {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Social Links"}
                </Button>
              </form>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </PortalLayout>
  );
}
