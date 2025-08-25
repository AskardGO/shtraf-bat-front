import { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "features/auth";

type RouteGuardProps = PropsWithChildren<{
    requireAuth?: boolean;
}>;

export const RouteGuard = ({ children, requireAuth = false }: RouteGuardProps) => {
    const { user, loading } = useAuthStore();

    if (loading) return <div>Loading...</div>;

    if (requireAuth && !user) return <Navigate to="/auth" replace />;
    if (!requireAuth && user) return <Navigate to="/" replace />;

    return <>{children}</>;
};
