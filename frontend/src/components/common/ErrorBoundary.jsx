import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🚨 ErrorBoundary caught an unhandled rendering error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "An unexpected error occurred during rendering.";

      return (
        <div className="section-shell py-24 min-h-[60vh] flex items-center justify-center">
          <div className="glass max-w-xl w-full rounded-[2rem] p-8 sm:p-10 text-center shadow-soft border border-ink/10 dark:border-white/10">
            <p className="eyebrow text-amber-600 dark:text-amber-400">Notice</p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink dark:text-white">
              Something slipped off the shelf.
            </h1>
            <p className="mt-3 text-sm text-ink/70 dark:text-white/70 leading-relaxed">
              We encountered a minor hitch while rendering this page. You can refresh or return home to continue browsing.
            </p>

            {this.state.error && (
              <div className="mt-5 rounded-2xl bg-black/5 dark:bg-white/5 p-4 text-left border border-black/10 dark:border-white/10">
                <p className="text-xs font-semibold text-rose-500 font-mono break-words">
                  {errorMessage}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-ink transition"
              >
                Refresh Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-full border border-ink/15 px-6 py-3 text-xs font-semibold text-ink hover:bg-ink/5 dark:border-white/15 dark:text-white dark:hover:bg-white/5 transition"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
