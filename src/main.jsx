import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import AppErrorBoundary from "./components/error/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { registerGlobalErrorHandlers } from "./services/logger";

registerGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2500,
              style: {
                background: "#fff",
                color: "#333",
                borderRadius: "10px",
                fontSize: "15px",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
