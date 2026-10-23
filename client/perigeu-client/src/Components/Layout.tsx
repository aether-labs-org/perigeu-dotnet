import {
    Alert,
    AppBar,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    LinearProgress,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Toolbar,
    Typography,
} from "@mui/material";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Doc from "./Doc";
import RouteCodeEditor from "./RouteCodeEditor";
import RoutesList from "./RoutesList";
import ScriptCodeEditor from "./ScriptCodeEditor";
import ScriptsList from "./ScriptsList";
import { DeleteRoute, DeleteScript, GetRoute, GetRoutes, GetScript, GetScripts, SaveRoute, SaveScript } from "../Services/PerigeuService";
import type { Route } from "../Types/Route";
import type { Script } from "../Types/Script";

type TabValue = "routes" | "scripts" | "docs";
type DeleteTarget = { type: "route" | "script"; id: number } | null;
type Notification = {
    open: boolean;
    severity: "success" | "error" | "info" | "warning";
    message: string;
};

const blankRoute: Route = {
    id: 0,
    method: "GET",
    path: "",
    script: `return {
    message = "WIP"
}`,
    scripts: [],
    utils: [],
};

const blankScript: Script = {
    id: 0,
    key: "",
    descricao: "",
    body: `local M = {}

return M`,
    dependencies: [],
};

function normalizeRoute(route: Route): Route {
    return {
        ...route,
        scripts: route.scripts ?? [],
        utils: route.utils ?? [],
    };
}

function normalizeScript(script: Script): Script {
    return {
        ...script,
        dependencies: script.dependencies ?? [],
    };
}

export default function Layout() {
    const [activeTab, setActiveTab] = useState<TabValue>("routes");
    const [routes, setRoutes] = useState<Route[]>([]);
    const [scripts, setScripts] = useState<Script[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
    const [selectedScriptId, setSelectedScriptId] = useState<number | null>(null);
    const [routeDraft, setRouteDraft] = useState<Route>(blankRoute);
    const [scriptDraft, setScriptDraft] = useState<Script>(blankScript);
    const [routeSearch, setRouteSearch] = useState("");
    const [scriptSearch, setScriptSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingRoute, setIsSavingRoute] = useState(false);
    const [isSavingScript, setIsSavingScript] = useState(false);
    const [isCreatingRoute, setIsCreatingRoute] = useState(false);
    const [isCreatingScript, setIsCreatingScript] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
    const [notification, setNotification] = useState<Notification>({
        open: false,
        severity: "success",
        message: "",
    });

    const deferredRouteSearch = useDeferredValue(routeSearch);
    const deferredScriptSearch = useDeferredValue(scriptSearch);

    const loadWorkspace = async () => {
        setIsLoading(true);
        try {
            const [nextRoutes, nextScripts] = await Promise.all([GetRoutes(), GetScripts()]);
            setRoutes(nextRoutes);
            setScripts(nextScripts.map(normalizeScript));
            return { routes: nextRoutes, scripts: nextScripts.map(normalizeScript) };
        } finally {
            setIsLoading(false);
        }
    };

    const openRoute = async (routeId: number) => {
        setActiveTab("routes");
        setIsCreatingRoute(false);
        const detail = await GetRoute(routeId);
        if (!detail) {
            setNotification({
                open: true,
                severity: "error",
                message: "Não foi possível carregar a rota selecionada.",
            });
            return;
        }

        setSelectedRouteId(detail.id);
        setRouteDraft(normalizeRoute(detail));
    };

    const openScript = async (scriptId: number) => {
        setActiveTab("scripts");
        setIsCreatingScript(false);
        const detail = await GetScript(scriptId);
        if (!detail) {
            setNotification({
                open: true,
                severity: "error",
                message: "Não foi possível carregar o script selecionado.",
            });
            return;
        }

        setSelectedScriptId(detail.id);
        setScriptDraft(normalizeScript(detail));
    };

    const createRoute = () => {
        setActiveTab("routes");
        setSelectedRouteId(null);
        setRouteDraft(blankRoute);
        setIsCreatingRoute(true);
    };

    const createScript = () => {
        setActiveTab("scripts");
        setSelectedScriptId(null);
        setScriptDraft(blankScript);
        setIsCreatingScript(true);
    };

    const saveRoute = async () => {
        const path = routeDraft.path.trim();
        if (!path) {
            setNotification({
                open: true,
                severity: "warning",
                message: "Informe o path da rota antes de salvar.",
            });
            return;
        }

        if (routes.some((route) => route.id !== routeDraft.id && route.path === path && route.method === routeDraft.method)) {
            setNotification({
                open: true,
                severity: "warning",
                message: "Já existe uma rota com o mesmo método e path.",
            });
            return;
        }

        setIsSavingRoute(true);
        try {
            const saved = await SaveRoute({
                ...routeDraft,
                path,
                scripts: routeDraft.scripts ?? [],
            });
            if (!saved) {
                throw new Error("Falha ao salvar rota");
            }

            setIsCreatingRoute(false);
            const workspace = await loadWorkspace();
            const refreshedRoute = workspace?.routes.find((route) => route.path === path && route.method === routeDraft.method);
            if (refreshedRoute) {
                await openRoute(refreshedRoute.id);
            }
            setNotification({
                open: true,
                severity: "success",
                message: "Rota salva com sucesso.",
            });
        } catch (error) {
            setNotification({
                open: true,
                severity: "error",
                message: error instanceof Error ? error.message : "Falha ao salvar a rota.",
            });
        } finally {
            setIsSavingRoute(false);
        }
    };

    const saveScript = async () => {
        const key = scriptDraft.key.trim();
        if (!key) {
            setNotification({
                open: true,
                severity: "warning",
                message: "Informe a chave do script antes de salvar.",
            });
            return;
        }

        if (scripts.some((script) => script.id !== scriptDraft.id && script.key === key)) {
            setNotification({
                open: true,
                severity: "warning",
                message: "Já existe um script com essa chave.",
            });
            return;
        }

        setIsSavingScript(true);
        try {
            const saved = await SaveScript({
                ...scriptDraft,
                key,
                dependencies: scriptDraft.dependencies ?? [],
            });
            if (!saved) {
                throw new Error("Falha ao salvar script");
            }

            setIsCreatingScript(false);
            const workspace = await loadWorkspace();
            const refreshedScript = workspace?.scripts.find((script) => script.key === key);
            if (refreshedScript) {
                await openScript(refreshedScript.id);
            }
            setNotification({
                open: true,
                severity: "success",
                message: "Script salvo com sucesso.",
            });
        } catch (error) {
            setNotification({
                open: true,
                severity: "error",
                message: error instanceof Error ? error.message : "Falha ao salvar o script.",
            });
        } finally {
            setIsSavingScript(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            if (deleteTarget.type === "route") {
                const ok = await DeleteRoute(deleteTarget.id);
                if (!ok) throw new Error("Falha ao excluir rota");
                setRouteDraft(blankRoute);
                setSelectedRouteId(null);
                setIsCreatingRoute(false);
            } else {
                const ok = await DeleteScript(deleteTarget.id);
                if (!ok) throw new Error("Falha ao excluir script");
                setScriptDraft(blankScript);
                setSelectedScriptId(null);
                setIsCreatingScript(false);
            }

            await loadWorkspace();
            setNotification({
                open: true,
                severity: "success",
                message: deleteTarget.type === "route" ? "Rota excluída." : "Script excluído.",
            });
        } catch (error) {
            setNotification({
                open: true,
                severity: "error",
                message: error instanceof Error ? error.message : "Falha ao excluir item.",
            });
        } finally {
            setDeleteTarget(null);
        }
    };

    useEffect(() => {
        void loadWorkspace();
    }, []);

    useEffect(() => {
        if (isCreatingRoute) {
            return;
        }

        if (routes.length === 0) {
            setSelectedRouteId(null);
            setRouteDraft(blankRoute);
            return;
        }

        const selectedExists = selectedRouteId !== null && routes.some((route) => route.id === selectedRouteId);
        if (!selectedExists) {
            void openRoute(routes[0].id);
        }
    }, [routes, selectedRouteId, isCreatingRoute]);

    useEffect(() => {
        if (isCreatingScript) {
            return;
        }

        if (scripts.length === 0) {
            setSelectedScriptId(null);
            setScriptDraft(blankScript);
            return;
        }

        const selectedExists = selectedScriptId !== null && scripts.some((script) => script.id === selectedScriptId);
        if (!selectedExists) {
            void openScript(scripts[0].id);
        }
    }, [scripts, selectedScriptId, isCreatingScript]);

    const filteredRoutes = useMemo(() => {
        const query = deferredRouteSearch.trim().toLowerCase();
        if (!query) {
            return routes;
        }

        return routes.filter((route) => {
            const path = route.path?.toLowerCase() ?? "";
            const method = route.method?.toLowerCase() ?? "";
            return path.includes(query) || method.includes(query);
        });
    }, [routes, deferredRouteSearch]);

    const filteredScripts = useMemo(() => {
        const query = deferredScriptSearch.trim().toLowerCase();
        if (!query) {
            return scripts;
        }

        return scripts.filter((script) => {
            const key = script.key?.toLowerCase() ?? "";
            const descricao = script.descricao?.toLowerCase() ?? "";
            return key.includes(query) || descricao.includes(query);
        });
    }, [scripts, deferredScriptSearch]);

    const selectedRoute = routes.find((route) => route.id === selectedRouteId);
    const selectedScript = scripts.find((script) => script.id === selectedScriptId);

    const stats = [
        { label: "Rotas", value: routes.length, tone: "primary" as const },
        { label: "Scripts", value: scripts.length, tone: "secondary" as const },
        { label: "Tab ativa", value: activeTab.toUpperCase(), tone: "info" as const },
    ];

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <AppBar position="sticky" elevation={0}>
                <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 220 }}>
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                background:
                                    "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(236,223,255,0.55))",
                                color: "#ffffff",
                                fontWeight: 900,
                                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)",
                            }}
                        >
                            P
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800} lineHeight={1}>
                                Perigeu
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                DuckDB + Lua sandbox
                            </Typography>
                        </Box>
                    </Stack>

                    <Tabs
                        value={activeTab}
                        onChange={(_, nextTab: TabValue) => setActiveTab(nextTab)}
                        textColor="inherit"
                    >
                        <Tab value="routes" label="Rotas" />
                        <Tab value="scripts" label="Scripts" />
                        <Tab value="docs" label="Sandbox" />
                    </Tabs>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button variant="outlined" onClick={createRoute}>
                            Nova rota
                        </Button>
                        <Button variant="outlined" onClick={createScript}>
                            Novo script
                        </Button>
                        <Button variant="contained" onClick={loadWorkspace}>
                            Atualizar
                        </Button>
                    </Stack>
                </Toolbar>
                {isLoading && <LinearProgress />}
            </AppBar>

            <Container maxWidth={false} sx={{ py: 3 }}>
                <Stack spacing={3} >
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            background:
                                "linear-gradient(135deg, rgba(253,250,255,0.96), rgba(245,238,255,0.92))",
                            borderColor: "rgba(111,66,193,0.12)",
                        }}
                        style={{display:"none"}}
                    >
                        <Stack
                            direction={{ xs: "column", lg: "row" }}
                            spacing={3}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", lg: "stretch" }}
                            
                        >
                            <Stack spacing={2} sx={{ maxWidth: 820, flex: 1 }} >
                                <Box>
                                    <Chip label="Material UI + DuckDB + Lua" size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                                    <Typography variant="h3" fontWeight={900} sx={{ mb: 1 }}>
                                        Editor visual para rotas, scripts e dependências
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        Organize scripts Lua como módulos, resolva dependências em ordem topológica e mantenha
                                        o sandbox documentado dentro do próprio client.
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip label="Dependências resolvidas em árvore" variant="outlined" />
                                    <Chip label="Preview da ordem de carregamento" variant="outlined" />
                                    <Chip label="Helpers documentados no client" variant="outlined" />
                                </Stack>
                            </Stack>

                            <Box
                                sx={{
                                    width: { xs: "100%", lg: 440 },
                                    display: "grid",
                                    gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" },
                                    gap: 1.25,
                                }}
                                    >
                                        {stats.map((stat) => (
                                            <Paper
                                                key={stat.label}
                                                variant="outlined"
                                        sx={{
                                            p: 1.5,
                                            textAlign: "center",
                                            backgroundColor: "rgba(255,255,255,0.82)",
                                            borderColor: "rgba(111,66,193,0.12)",
                                                }}
                                            >
                                                <Typography variant="h5" fontWeight={900} sx={{ color: `${stat.tone}.main` }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {stat.label}
                                                </Typography>
                                    </Paper>
                                ))}
                            </Box>
                        </Stack>
                    </Paper>

                    {activeTab === "routes" && (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", xl: "360px minmax(0, 1fr)" },
                                gap: 2,
                                alignItems: "stretch",
                            }}
                        >
                            <RoutesList
                                routes={filteredRoutes}
                                selectedRouteId={selectedRouteId}
                                search={routeSearch}
                                loading={isLoading && routes.length === 0}
                                onSearchChange={setRouteSearch}
                                onSelect={(routeId) => {
                                    void openRoute(routeId);
                                }}
                                onDelete={(routeId) => setDeleteTarget({ type: "route", id: routeId })}
                                onCreateNew={createRoute}
                                onRefresh={loadWorkspace}
                            />
                            <RouteCodeEditor
                                value={routeDraft}
                                availableScripts={scripts}
                                onChange={setRouteDraft}
                                onSave={() => {
                                    void saveRoute();
                                }}
                                onCreateNew={createRoute}
                                onDelete={() => {
                                    if (routeDraft.id > 0) {
                                        setDeleteTarget({ type: "route", id: routeDraft.id });
                                    }
                                }}
                                saving={isSavingRoute}
                            />
                        </Box>
                    )}

                    {activeTab === "scripts" && (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", xl: "360px minmax(0, 1fr)" },
                                gap: 2,
                                alignItems: "stretch",
                            }}
                        >
                            <ScriptsList
                                scripts={filteredScripts}
                                selectedScriptId={selectedScriptId}
                                search={scriptSearch}
                                loading={isLoading && scripts.length === 0}
                                onSearchChange={setScriptSearch}
                                onSelect={(scriptId) => {
                                    void openScript(scriptId);
                                }}
                                onDelete={(scriptId) => setDeleteTarget({ type: "script", id: scriptId })}
                                onCreateNew={createScript}
                                onRefresh={loadWorkspace}
                            />
                            <ScriptCodeEditor
                                value={scriptDraft}
                                availableScripts={scripts}
                                onChange={setScriptDraft}
                                onSave={() => {
                                    void saveScript();
                                }}
                                onCreateNew={createScript}
                                onDelete={() => {
                                    if (scriptDraft.id > 0) {
                                        setDeleteTarget({ type: "script", id: scriptDraft.id });
                                    }
                                }}
                                saving={isSavingScript}
                            />
                        </Box>
                    )}

                    {activeTab === "docs" && <Doc />}
                </Stack>
            </Container>

            <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)}>
                <DialogTitle>Confirmar exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {deleteTarget?.type === "route"
                            ? "Essa rota será removida junto com seus vínculos de scripts."
                            : "Esse script será removido e as dependências associadas serão atualizadas."}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={() => void confirmDelete()}>
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={3500}
                onClose={() => setNotification((current) => ({ ...current, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                    onClose={() => setNotification((current) => ({ ...current, open: false }))}
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            <Box sx={{ px: 3, pb: 3 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                        backgroundColor: "rgba(253,250,255,0.95)",
                    }}
                >
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                            label={selectedRoute ? `Rota: ${selectedRoute.path || "sem path"}` : "Nenhuma rota selecionada"}
                            variant="outlined"
                        />
                        <Chip
                            label={
                                selectedScript
                                    ? `Script: ${selectedScript.key || "sem chave"}`
                                    : "Nenhum script selecionado"
                            }
                            variant="outlined"
                        />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Use as listas laterais para navegar, criar e remover itens sem perder o contexto do editor.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
}
