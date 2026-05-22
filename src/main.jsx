import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { TransactionsProvider } from "./context/TransactionsContext";
import { CategoriesProvider } from "./context/CategoriesContext";
import { PaymentMethodsProvider } from "./context/PaymentMethodsContext";

import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <TransactionsProvider>
            <CategoriesProvider>
              <PaymentMethodsProvider>
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
              </PaymentMethodsProvider>
            </CategoriesProvider>
          </TransactionsProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
