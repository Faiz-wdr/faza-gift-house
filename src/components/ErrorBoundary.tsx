import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            margin: "2rem auto",
            maxWidth: "700px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #F5C6CB",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(20, 20, 20, 0.06)",
            fontFamily: "Poppins, -apple-system, sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(220, 53, 69, 0.1)",
              color: "#DC3545",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
              margin: "0 auto 1rem auto",
            }}
          >
            !
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              color: "#7D044B",
              marginBottom: "0.5rem",
              fontWeight: 600,
            }}
          >
            {this.props.fallbackTitle || "Something went wrong in this section"}
          </h2>
          <p
            style={{
              color: "#63585E",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}
          >
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: "0.6rem 1.4rem",
                backgroundColor: "#7D044B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: "0.6rem 1.4rem",
                backgroundColor: "#F1EDF0",
                color: "#141414",
                border: "none",
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "0.88rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
