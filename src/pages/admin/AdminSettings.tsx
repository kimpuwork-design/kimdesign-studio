import { useEffect, useState } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { StudioSettings, uploadPortfolioImage } from "@/lib/portfolio";
import { writeAuditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, X } from "lucide-react";

export default function AdminSettings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").single().then(({ data }) => {
      if (data) setSettings(data as StudioSettings);
    });
  }, []);

  const set = (k: keyof StudioSettings, v: string | null) =>
    setSettings((s) => s ? { ...s, [k]: v } : s);

  const handleLogoUpload = async (file: File) => {
    if (!settings) return;
    setLogoUploading(true);
    // Use "logos" subfolder in portfolio bucket
    const path = `logos/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); setLogoUploading(false); return; }
    const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
    set("logo_url", data.publicUrl);
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
    }).eq("id", settings.id);

    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ actor_id: profile.id, action: "settings_updated", entity_type: "settings", entity_id: settings.id });
    toast({ title: "Settings saved ✓" });
  };

  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Settings</h1>
        <p className="mt-1 text-portal-text-muted">Studio branding, contact info, and social links.</p>
      </div>

      {!settings ? (
        <div className="flex items-center gap-2 py-10 text-portal-text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          {/* Branding */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-6 space-y-4">
            <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider">Branding</h2>

            {/* Logo */}
            <div>
              <Label className="text-portal-text-muted text-xs mb-2 block">Logo</Label>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <div className="relative">
                    <img src={settings.logo_url} alt="Logo" className="h-14 w-auto rounded-lg object-contain bg-portal-bg border border-portal-border p-1" />
                    <button type="button" onClick={() => set("logo_url", null)}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-white">
                      <X size={10} />
                    </button>
                  </div>
                ) : null}
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-xs text-portal-text-muted hover:border-portal-accent/50 hover:text-portal-text transition-colors">
                  {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {logoUploading ? "Uploading…" : "Upload Logo"}
                  <input type="file" accept="image/*" className="sr-only"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                </label>
                <span className="text-xs text-portal-text-muted">or</span>
                <Input value={settings.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value || null)}
                  placeholder="https://…" className="flex-1 bg-portal-bg border-portal-border text-portal-text text-xs" />
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

          {/* Contact */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-6 space-y-4">
            <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider">Contact</h2>
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

          {/* Socials */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-6 space-y-4">
            <h2 className="font-semibold text-portal-text text-sm uppercase tracking-wider">Social Links</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { key: "instagram_url" as const, label: "Instagram", placeholder: "https://instagram.com/…" },
                { key: "behance_url" as const, label: "Behance", placeholder: "https://behance.net/…" },
                { key: "facebook_url" as const, label: "Facebook", placeholder: "https://facebook.com/…" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-portal-text-muted text-xs">{label}</Label>
                  <Input value={settings[key] ?? ""} onChange={(e) => set(key, e.target.value || null)}
                    placeholder={placeholder} className="bg-portal-bg border-portal-border text-portal-text text-xs" />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
            {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Settings"}
          </Button>
        </form>
      )}
    </PortalLayout>
  );
}
