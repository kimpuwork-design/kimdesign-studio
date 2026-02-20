import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ClientProfile() {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [company, setCompany] = useState(profile?.company ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName, company, phone }).eq("id", profile?.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <PortalLayout variant="client">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">My Profile</h1>
        <p className="mt-1 text-portal-text-muted">Manage your personal information.</p>
      </div>
      <div className="max-w-lg rounded-xl border border-portal-border bg-portal-surface p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-portal-text-muted">Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-portal-bg border-portal-border text-portal-text" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-portal-text-muted">Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-portal-bg border-portal-border text-portal-text" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-portal-text-muted">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-portal-bg border-portal-border text-portal-text" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-portal-text-muted">Role</Label>
            <Input value={profile?.role ?? ""} disabled className="bg-portal-bg border-portal-border text-portal-text-muted" />
          </div>
          <Button type="submit" disabled={saving} className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
          </Button>
        </form>
      </div>
    </PortalLayout>
  );
}
