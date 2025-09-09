import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../app/context/authContext";

export default function PublicRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // While checking auth, don't render anything to prevent flickers
        return null;
    }

    if (isAuthenticated) {
        // If user is logged in, redirect them away from the auth page
        return <Navigate to="/dashboard" replace />;
    }

    // If user is not logged in, show the auth page
    return <Outlet />;
}