import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, userProfile, loadingAuth, loadingProfile } = useAuth();
  const location = useLocation();

  if (loadingAuth || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbff]">
        <div className="w-12 h-12 border-4 border-[#1f67ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
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
