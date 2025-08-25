import {
    createBrowserRouter,
    Navigate,
    RouterProvider,
} from "react-router-dom";
import {RouteGuard} from "app/navigation/ProtectedRoute.tsx";

//pages
import {AuthPage} from "features/auth";
import {MainPage} from "features/main";

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <RouteGuard requireAuth>
                <MainPage />
            </RouteGuard>
        ),
    },
    {
        path: "/auth",
        element: (
            <RouteGuard>
                <AuthPage />
            </RouteGuard>
        ),
    },
    { path: "*", element: <Navigate to="/auth" replace /> },
]);


export const AppRouter = () => {
    return <RouterProvider router={router} />;
}
