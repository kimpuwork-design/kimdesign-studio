import { PortalLayout } from "@/components/PortalLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Settings {
  id: string;
  studio_name: string;
  contact_email: string;
  logo_url: string | null;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("*").single().then(({ data }) => {
      if (data) setSettings(data as Settings);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    await supabase.from("settings").update({
      studio_name: settings.studio_name,
      contact_email: settings.contact_email,
    }).eq("id", settings.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Settings</h1>
        <p className="mt-1 text-portal-text-muted">Studio configuration and preferences.</p>
      </div>
      <div className="max-w-lg rounded-xl border border-portal-border bg-portal-surface p-6">
        {settings ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-portal-text-muted">Studio Name</Label>
              <Input
                value={settings.studio_name}
                onChange={(e) => setSettings({ ...settings, studio_name: e.target.value })}
                className="bg-portal-bg border-portal-border text-portal-text"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-portal-text-muted">Contact Email</Label>
              <Input
                type="email"
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="bg-portal-bg border-portal-border text-portal-text"
              />
            </div>
            <Button type="submit" disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
            </Button>
          </form>
        ) : (
          <p className="text-portal-text-muted text-sm">Loading settings...</p>
        )}
      </div>
    </PortalLayout>
  );
}
