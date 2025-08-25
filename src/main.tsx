import React from "react";
import ReactDOM from "react-dom/client";
import {FirebaseProvider} from "app/firebase/provider.tsx";
import {AppRouter} from "app/navigation";
import App from "./App.tsx";
import {patchFetch} from "app/proxyFetch.ts";

const proxyUrl =
    import.meta.env.DEV_MODE
        ? "http://localhost:8080"
        : "https://proxy-0wiv.onrender.com";

patchFetch(proxyUrl);

console.log(proxyUrl)

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <FirebaseProvider>
            <App router={<AppRouter />} />
        </FirebaseProvider>
    </React.StrictMode>,
);
