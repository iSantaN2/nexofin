import React from "react";
import AppCrashFallback from "./AppCrashFallback";
import { logError } from "../../services/logger";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logError("React render error boundary", error, {
      source: "react.error-boundary",
      componentStack: errorInfo?.componentStack || null,
    });
  }

  render() {
    if (this.state.hasError) {
      return <AppCrashFallback />;
    }

    return this.props.children;
  }
}
