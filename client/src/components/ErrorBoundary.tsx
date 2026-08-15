import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen text-gray-50 font-sans flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-900 rounded-xl border border-slate-800/60 p-8 text-center">
            <div className="text-4xl mb-4">!</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm border-0 cursor-pointer hover:bg-blue-700 active:bg-blue-800"
            >
              Please Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
