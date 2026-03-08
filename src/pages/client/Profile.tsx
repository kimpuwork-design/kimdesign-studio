import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/admin/AvatarUpload";
import { User, Building2, Phone, Shield, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientProfile() {
  const { profile, user } = useAuth();
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

  const initials = (profile?.full_name ?? "?").split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);

  return (
    <PortalLayout variant="client">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-portal-accent/20">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile?.full_name ?? ""} />}
                <AvatarFallback className="bg-gradient-to-br from-portal-accent/30 to-portal-accent/10 text-portal-accent text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-portal-bg flex items-center justify-center">
                <Check size={10} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-portal-text">{profile?.full_name ?? "Your Profile"}</h1>
              <p className="text-sm text-portal-text-muted mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-portal-accent/15 px-2.5 py-0.5 text-[10px] font-semibold text-portal-accent uppercase tracking-wider">
                  <Shield size={10} /> {profile?.role}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h2 className="font-display text-sm font-semibold text-portal-text mb-5">Personal Information</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-portal-text-muted flex items-center gap-1.5">
                  <User size={11} /> Full Name
                </Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="bg-portal-surface/40 border-portal-border/50 text-portal-text h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-portal-text-muted flex items-center gap-1.5">
                  <Building2 size={11} /> Company
                </Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)}
                  className="bg-portal-surface/40 border-portal-border/50 text-portal-text h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-portal-text-muted flex items-center gap-1.5">
                <Phone size={11} /> Phone
              </Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="bg-portal-surface/40 border-portal-border/50 text-portal-text h-9 text-sm max-w-xs" />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={saving}
                className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90 shadow-lg shadow-portal-accent/20">
                {saving ? (
                  <><Loader2 size={14} className="mr-1.5 animate-spin" /> Saving...</>
                ) : saved ? (
                  <><Check size={14} className="mr-1.5" /> Saved</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </PortalLayout>
  );
}
