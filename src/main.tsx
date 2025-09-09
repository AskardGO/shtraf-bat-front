import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "app/navigation";
import App from "./App.tsx";
import { useAuthStore } from "shared/stores/authStore";

const AppWithAuth = () => {
    const { checkAuth } = useAuthStore();
    
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
    
    return <App router={<AppRouter />} />;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <AppWithAuth />
    </React.StrictMode>,
);
