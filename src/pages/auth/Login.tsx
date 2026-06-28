import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { loginSchema, zodFieldErrors } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed));
      return;
    }
    setLoading(true);
    try {
      const { error } = await signIn(parsed.data.email, parsed.data.password);
      if (error) {
        const msg = friendlyErrorMessage(error);
        setError(msg);
        toast.error("Sign in failed", { description: msg });
        return;
      }
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setError(msg);
      toast.error("Sign in failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  if (profile) {
    if (profile.role === "ADMIN") navigate("/admin", { replace: true });
    else if (profile.role === "STAFF") navigate("/staff", { replace: true });
    else navigate("/app", { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-portal-bg px-4 overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-portal-accent/10 blur-[120px] animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-portal-accent/5 blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <Sparkles size={20} className="text-portal-accent group-hover:animate-glow-pulse" />
            <span className="font-display text-2xl font-bold text-portal-text">FORMA</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-portal-text">Welcome back</h1>
          <p className="mt-2 text-sm text-portal-text-muted">Sign in to your account to continue</p>
        </div>

        <div className="glass-card p-8 glass-glow-ring">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-portal-text-muted">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-portal-bg/50 border-portal-border text-portal-text placeholder:text-portal-text-muted focus:ring-portal-accent focus:border-portal-accent"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-portal-text-muted">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10 bg-portal-bg/50 border-portal-border text-portal-text placeholder:text-portal-text-muted focus:ring-portal-accent focus:border-portal-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-text-muted hover:text-portal-text transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-portal-text-muted">
            Use your existing account to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
