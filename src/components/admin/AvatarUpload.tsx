import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export function AvatarUpload() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  if (!profile) return null;

  const initials = (profile.full_name ?? "?").split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `${profile.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updateErr } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
    if (updateErr) {
      toast({ title: "Failed to save", description: updateErr.message, variant: "destructive" });
    } else {
      toast({ title: "Avatar updated ✓" });
      // Force reload to update avatar across the app
      window.location.reload();
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
    if (error) {
      toast({ title: "Failed to remove", variant: "destructive" });
    } else {
      toast({ title: "Avatar removed" });
      window.location.reload();
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-portal-text-muted text-xs">Profile Photo</Label>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />}
          <AvatarFallback className="bg-portal-accent/20 text-portal-accent text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-xs text-portal-text-muted hover:border-portal-accent/50 hover:text-portal-text transition-colors">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? "Uploading…" : "Upload"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          </label>
          {profile.avatar_url && (
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 rounded-lg border border-portal-border bg-portal-bg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X size={12} /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
