import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function NotAuthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <ShieldX size={48} className="text-destructive" />
      <h1 className="font-display text-3xl font-bold">Not Authorized</h1>
      <p className="text-muted-foreground max-w-sm text-center">
        You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <div className="flex gap-3 mt-2">
        <Button variant="outline" asChild><Link to="/">Go Home</Link></Button>
        <Button asChild><Link to="/app">My Dashboard</Link></Button>
      </div>
    </div>
  );
}
