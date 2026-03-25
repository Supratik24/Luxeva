import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="section-shell py-24">
          <div className="glass rounded-[2rem] p-10 text-center shadow-soft">
            <p className="eyebrow">Fallback UI</p>
            <h1 className="mt-4 font-display text-4xl">Something slipped off the shelf.</h1>
            <p className="mt-3 text-muted">Refresh the page or head back home to continue shopping.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

