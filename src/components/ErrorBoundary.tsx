import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in dev console; production observers can hook in later.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
        >
          <div className="max-w-md space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Something went wrong
            </p>
            <h1 className="font-display text-3xl text-foreground">
              We hit an unexpected error
            </h1>
            <p className="text-sm text-muted-foreground">
              The page couldn't render. Try reloading — if it keeps happening,
              please let us know.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={this.reset}
              className="rounded-sm border border-border px-5 py-2 text-sm hover:bg-muted/40"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.assign("/")}
              className="rounded-sm bg-primary px-5 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
