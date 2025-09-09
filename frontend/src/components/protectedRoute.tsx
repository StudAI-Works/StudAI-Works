import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../app/context/authContext"; // Adjusted import path
import { Spinner } from "./ui/spinner";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Spinner size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Outlet />;
  }

  return <Navigate to="/auth" replace />;
}