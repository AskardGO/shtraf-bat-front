export function patchFetch(proxyBase = "http://localhost:8080") {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        let url = typeof input === "string" ? input : input.toString();

        if (
            url.includes("firebaseio.com") ||
            url.includes("googleapis.com") ||
            url.includes("firebaseinstallations.googleapis.com") ||
            url.includes("firebasestorage.googleapis.com")
        ) {
            const encodedUrl = encodeURIComponent(url);
            return originalFetch(`${proxyBase}/proxy?url=${encodedUrl}`, {
                ...init,
                method: init?.method ?? "GET",
                body: init?.body,
                headers: init?.headers,
            });
        }

        return originalFetch(input, init);
    };
}
