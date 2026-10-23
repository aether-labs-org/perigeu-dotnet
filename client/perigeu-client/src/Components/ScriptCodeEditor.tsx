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
import type { Script } from "../Types/Script";
import { buildScriptIndex, resolveDependencyPreview } from "../Utils/dependencyGraph";

const LUA_TEMPLATE = `local M = {}

function M:new()
    local instance = {}
    setmetatable(instance, { __index = self })
    return instance
end

return M`;

type ScriptCodeEditorProps = {
    value: Script;
    availableScripts: Script[];
    onChange: (next: Script) => void;
    onSave: () => void;
    onCreateNew: () => void;
    onDelete: () => void;
    saving?: boolean;
};

export default function ScriptCodeEditor({
    value,
    availableScripts,
    onChange,
    onSave,
    onCreateNew,
    onDelete,
    saving,
}: ScriptCodeEditorProps) {
    const selectableScripts = availableScripts.filter((script) => script.id !== value.id);
    const selectedDependencies = value.dependencies ?? [];

    const scriptIndex = useMemo(() => buildScriptIndex(availableScripts), [availableScripts]);
    const dependencyPreview = useMemo(
        () => resolveDependencyPreview(selectedDependencies, scriptIndex),
        [selectedDependencies, scriptIndex]
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
                        {value.id > 0 ? `Script #${value.id}` : "Novo script"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
                        Declare dependências e retorne uma table para consumo nas rotas.
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
                            label="Chave"
                            value={value.key}
                            onChange={(event) => onChange({ ...value, key: event.target.value })}
                            placeholder="meuServico"
                            helperText="Chave estável usada pelo Require() e pela seleção nas rotas."
                        />
                        <TextField
                            label="Descrição"
                            value={value.descricao}
                            onChange={(event) => onChange({ ...value, descricao: event.target.value })}
                            placeholder="Descrição curta e objetiva"
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
                        options={selectableScripts}
                        value={selectedDependencies}
                        onChange={(_, nextDependencies) => onChange({ ...value, dependencies: nextDependencies })}
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
                                label="Dependências"
                                helperText="Selecione os módulos-base. O carregamento final resolve a árvore sem duplicar nós."
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
                                <Chip size="small" label={`${dependencyPreview.order.length} itens`} color="secondary" variant="outlined" />
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
                                            color="secondary"
                                            variant="outlined"
                                            sx={{ alignSelf: "start" }}
                                        />
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {layer.map((script) => (
                                                <Chip
                                                    key={script.id}
                                                    label={script.key || script.descricao || `#${script.id}`}
                                                    variant="filled"
                                                    color={index === 0 ? "primary" : "secondary"}
                                                    size="small"
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        ) : (
                            <EmptyState
                                title="Nenhuma dependência selecionada"
                                description="Selecione módulos para visualizar a árvore de execução do script."
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
                    value={value.body || LUA_TEMPLATE}
                    onChange={(nextValue) => onChange({ ...value, body: nextValue ?? "" })}
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
