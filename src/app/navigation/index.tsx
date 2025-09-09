import {
    createBrowserRouter,
    Navigate,
    RouterProvider,
} from "react-router-dom";
import { ProtectedRoute } from "shared/ui/ProtectedRoute";

//pages
import {AuthPage} from "features/auth";
import {MainPage} from "features/main";

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <MainPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/auth",
        element: <AuthPage />,
    },
    { path: "*", element: <Navigate to="/" replace /> },
], {
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
        v7_fetcherPersist: true,
        v7_normalizeFormMethod: true,
        v7_partialHydration: true,
        v7_skipActionErrorRevalidation: true,
    }
});


export const AppRouter = () => {
    return <RouterProvider router={router} />;
}
