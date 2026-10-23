import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import Editor from "@monaco-editor/react";
import { useMemo } from "react";
import EmptyState from "./EmptyState";
import type { Route } from "../Types/Route";
import type { Script } from "../Types/Script";
import { buildScriptIndex, resolveDependencyPreview } from "../Utils/dependencyGraph";

const LUA_TEMPLATE = `return {
    message = "WIP"
}`;

type RouteCodeEditorProps = {
    value: Route;
    availableScripts: Script[];
    onChange: (next: Route) => void;
    onSave: () => void;
    onCreateNew: () => void;
    onDelete: () => void;
    saving?: boolean;
};

export default function RouteCodeEditor({
    value,
    availableScripts,
    onChange,
    onSave,
    onCreateNew,
    onDelete,
    saving,
}: RouteCodeEditorProps) {
    const selectedScripts = value.scripts ?? [];

    const scriptIndex = useMemo(() => buildScriptIndex(availableScripts), [availableScripts]);
    const dependencyPreview = useMemo(
        () => resolveDependencyPreview(selectedScripts, scriptIndex),
        [selectedScripts, scriptIndex]
    );

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.25,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(252,248,255,0.98))",
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
            >
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em" }}>
                        {value.id > 0 ? `Rota #${value.id}` : "Nova rota"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
                        Configure método, path, scripts e o corpo Lua.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button variant="text" startIcon={<AddIcon />} onClick={onCreateNew}>
                        Novo
                    </Button>
                    <Button variant="text" color="error" startIcon={<DeleteOutlineIcon />} onClick={onDelete}>
                        Excluir
                    </Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave} disabled={saving}>
                        Salvar
                    </Button>
                </Stack>
            </Stack>

            <Stack spacing={1.5}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 1.75,
                        backgroundColor: "rgba(255,255,255,0.78)",
                    }}
                >
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                        <TextField
                            select
                            label="Método"
                            value={value.method}
                            onChange={(event) => onChange({ ...value, method: event.target.value })}
                            SelectProps={{ native: true }}
                        >
                            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            ))}
                        </TextField>
                        <TextField
                            label="Path"
                            value={value.path}
                            onChange={(event) => onChange({ ...value, path: event.target.value })}
                            placeholder="/minha-rota"
                            helperText="Use rotas explícitas e consistentes."
                        />
                    </Stack>
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{
                        p: 1.75,
                        backgroundColor: "rgba(255,255,255,0.78)",
                    }}
                >
                    <Autocomplete
                        multiple
                        options={availableScripts}
                        value={selectedScripts}
                        onChange={(_, nextScripts) => onChange({ ...value, scripts: nextScripts })}
                        isOptionEqualToValue={(option, current) => option.id === current.id}
                        getOptionLabel={(option) => option.key || option.descricao || `Script #${option.id}`}
                        renderTags={(tagValue, getTagProps) =>
                            tagValue.map((option, index) => (
                                <Chip
                                    {...getTagProps({ index })}
                                    key={option.id}
                                    label={option.key || option.descricao || `#${option.id}`}
                                    size="small"
                                    variant="outlined"
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Scripts diretos"
                                helperText="A rota carrega esses scripts e a árvore completa sem duplicar nós."
                            />
                        )}
                    />
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{
                        p: 1.75,
                        backgroundColor: "rgba(111,66,193,0.035)",
                    }}
                >
                    <Stack spacing={1.25}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800}>
                                    Dependências resolvidas
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    A sequência abaixo mostra a ordem efetiva de carregamento.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                                <Chip size="small" label={`${dependencyPreview.order.length} itens`} color="primary" variant="outlined" />
                                <Chip size="small" label={`${dependencyPreview.layers.length} níveis`} variant="outlined" />
                            </Stack>
                        </Stack>

                        {dependencyPreview.order.length > 0 ? (
                            <Stack spacing={1.25}>
                                {dependencyPreview.layers.map((layer, index) => (
                                    <Box
                                        key={`${index}-${layer.map((script) => script.id).join("-")}`}
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: "auto 1fr",
                                            gap: 1.25,
                                            alignItems: "start",
                                            p: 1.25,
                                            borderRadius: 2,
                                            backgroundColor: "rgba(255,255,255,0.7)",
                                            border: "1px solid rgba(111,66,193,0.1)",
                                        }}
                                    >
                                        <Chip
                                            size="small"
                                            label={`Nível ${index + 1}`}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ alignSelf: "start" }}
                                        />
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {layer.map((script) => (
                                                <Chip
                                                    key={script.id}
                                                    label={script.key || script.descricao || `#${script.id}`}
                                                    variant="filled"
                                                    color={index === 0 ? "secondary" : "primary"}
                                                    size="small"
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        ) : (
                            <EmptyState
                                title="Nenhum script selecionado"
                                description="Selecione scripts diretos para visualizar a árvore de execução da rota."
                                icon={<AddIcon fontSize="small" />}
                            />
                        )}

                        {dependencyPreview.hasCycle && (
                            <Alert severity="error">
                                Dependência circular detectada. Ajuste a árvore antes de salvar.
                            </Alert>
                        )}

                        {dependencyPreview.missing.length > 0 && (
                            <Alert severity="warning">
                                Dependências ausentes: {dependencyPreview.missing.join(", ")}.
                            </Alert>
                        )}
                    </Stack>
                </Paper>
            </Stack>

            <Box
                sx={{
                    flex: 1,
                    minHeight: 520,
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Editor
                    height="100%"
                    defaultLanguage="lua"
                    theme="vs"
                    value={value.script || LUA_TEMPLATE}
                    onChange={(nextValue) => onChange({ ...value, script: nextValue ?? "" })}
                    options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        padding: { top: 16, bottom: 16 },
                        fontLigatures: true,
                    }}
                />
            </Box>
        </Paper>
    );
}
