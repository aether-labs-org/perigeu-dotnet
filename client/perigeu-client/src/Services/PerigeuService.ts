import type { Route } from "../Types/Route";
import type { Script } from "../Types/Script";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5184";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const hasBody = init?.body !== undefined && init?.body !== null;
    const response = await fetch(`${apiUrl}${path}`, {
        headers: {
            Accept: "application/json",
            ...(hasBody ? { "Content-Type": "application/json" } : {}),
            ...(init?.headers ?? {})
        },
        ...init
    });

    if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return await response.json();
}

async function requestOk(path: string, init?: RequestInit): Promise<void> {
    const hasBody = init?.body !== undefined && init?.body !== null;
    const response = await fetch(`${apiUrl}${path}`, {
        headers: {
            Accept: "application/json",
            ...(hasBody ? { "Content-Type": "application/json" } : {}),
            ...(init?.headers ?? {})
        },
        ...init
    });

    if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Request failed: ${response.status}`);
    }
}

export async function GetRoutes(): Promise<Route[]> {
    try {
        return await requestJson<Route[]>("/Perigeu");
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function GetRoute(id: number): Promise<Route | null> {
    try {
        return await requestJson<Route>(`/Perigeu/${id}`);
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function SaveRoute(route: Route): Promise<boolean> {
    try {
        await requestOk("/Perigeu", {
            method: "POST",
            body: JSON.stringify(route)
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function DeleteRoute(id: number): Promise<boolean> {
    try {
        await requestOk(`/Perigeu/${id}`, { method: "DELETE" });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function GetScripts(): Promise<Script[]> {
    try {
        return await requestJson<Script[]>("/Perigeu/Script");
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function GetScript(id: number): Promise<Script | null> {
    try {
        return await requestJson<Script>(`/Perigeu/Script/${id}`);
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function SaveScript(script: Script): Promise<boolean> {
    try {
        await requestOk("/Perigeu/Script", {
            method: "POST",
            body: JSON.stringify(script)
        });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function DeleteScript(id: number): Promise<boolean> {
    try {
        await requestOk(`/Perigeu/Script/${id}`, { method: "DELETE" });
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}
