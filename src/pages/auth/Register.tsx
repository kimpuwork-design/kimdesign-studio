import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { registerSchema, zodFieldErrors } from "@/lib/validation";
import { friendlyErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const parsed = registerSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed));
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName);
      if (error) {
        const msg = friendlyErrorMessage(error);
        setError(msg);
        toast.error("Couldn't create account", { description: msg });
        return;
      }
      setSuccess(true);
      toast.success("Account created", { description: "Check your email to confirm." });
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setError(msg);
      toast.error("Couldn't create account", { description: msg });
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-portal-bg px-4 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-portal-accent/10 blur-[120px] animate-float pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] animate-float-delayed pointer-events-none" />
        <div className="relative z-10 w-full max-w-md text-center glass-card p-12 animate-scale-in">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="font-display text-2xl font-bold text-portal-text">Check your email</h1>
          <p className="mt-2 text-portal-text-muted">
            We sent a confirmation link to <strong className="text-portal-text">{email}</strong>. Click it to activate your account.
          </p>
          <Button className="mt-6 bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90" onClick={() => navigate("/auth/login")}>Go to Login</Button>
        </div>
      </div>
    );
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
          <h1 className="font-display text-3xl font-bold text-portal-text">Create account</h1>
          <p className="mt-2 text-sm text-portal-text-muted">Start your journey with FORMA</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-describedby={error ? "register-form-error" : undefined}>
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-portal-text-muted">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                aria-invalid={!!fieldErrors.fullName}
                aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                className="bg-portal-bg/50 border-portal-border text-portal-text placeholder:text-portal-text-muted focus-visible:ring-2 focus-visible:ring-portal-accent focus-visible:ring-offset-2 focus-visible:ring-offset-portal-bg focus:border-portal-accent"
              />
              {fieldErrors.fullName && <p id="fullName-error" role="alert" className="text-xs text-destructive">{fieldErrors.fullName}</p>}
            </div>
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
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className="bg-portal-bg/50 border-portal-border text-portal-text placeholder:text-portal-text-muted focus-visible:ring-2 focus-visible:ring-portal-accent focus-visible:ring-offset-2 focus-visible:ring-offset-portal-bg focus:border-portal-accent"
              />
              {fieldErrors.email && <p id="email-error" role="alert" className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-portal-text-muted">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters, with a letter and a number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
                className="bg-portal-bg/50 border-portal-border text-portal-text placeholder:text-portal-text-muted focus-visible:ring-2 focus-visible:ring-portal-accent focus-visible:ring-offset-2 focus-visible:ring-offset-portal-bg focus:border-portal-accent"
              />
              {fieldErrors.password ? (
                <p id="password-error" role="alert" className="text-xs text-destructive">{fieldErrors.password}</p>
              ) : (
                <p id="password-hint" className="text-xs text-portal-text-muted">At least 8 characters, including a letter and a number.</p>
              )}
            </div>

            {error && (
              <p id="register-form-error" role="alert" aria-live="assertive" className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full min-h-11 bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-portal-text-muted">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-medium text-portal-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
