import type { Route } from "../Types/Route";
import type { Script } from "../Types/Script";

const apiUrl: string = "http://localhost:5184"

export async function GetRoutes(): Promise<Route[]> {
    try {
        const response = await fetch(`${apiUrl}/Perigeu`);
        if (!response.ok) throw new Error("Erro ao buscar scripts");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}


export async function SaveRoute(script: Route): Promise<Route | null> {
    try {
        const response = await fetch(`${apiUrl}/Perigeu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(script)
        });
        if (!response.ok) throw new Error("Erro ao salvar o script");
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}


export async function DeleteRoute(id: number): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/Perigeu/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
}


export async function GetScripts(): Promise<Script[]> {
    try {
        const response = await fetch(`${apiUrl}/Perigeu`);
        if (!response.ok) throw new Error("Erro ao buscar scripts");
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}


export async function SaveScript(script: Script): Promise<Script | null> {
    try {
        const response = await fetch(`${apiUrl}/Perigeu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(script)
        });
        if (!response.ok) throw new Error("Erro ao salvar o script");
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function DeleteScript(id: number): Promise<boolean> {
    try {
        const response = await fetch(`${apiUrl}/Perigeu/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
}
