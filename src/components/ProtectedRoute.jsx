import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./ui/LoadingState";

export default function ProtectedRoute({ children }) {
  const { user, userProfile, loadingAuth, loadingProfile } = useAuth();
  const location = useLocation();

  if (loadingAuth || loadingProfile) {
    return (
      <LoadingState
        fullScreen
        title="Validando tu sesión"
        description="Estamos preparando tu espacio financiero."
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.emailVerified && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  if (
    user.emailVerified &&
    userProfile &&
    userProfile.onboardingCompleted === false &&
    location.pathname !== "/onboarding"
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
