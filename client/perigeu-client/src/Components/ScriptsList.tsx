import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArticleIcon from "@mui/icons-material/Article";
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    Skeleton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import EmptyState from "./EmptyState";
import type { Script } from "../Types/Script";

type ScriptsListProps = {
    scripts: Script[];
    selectedScriptId: number | null;
    search: string;
    loading?: boolean;
    onSearchChange: (value: string) => void;
    onSelect: (scriptId: number) => void;
    onDelete: (scriptId: number) => void;
    onCreateNew: () => void;
    onRefresh: () => void;
};

export default function ScriptsList({
    scripts,
    selectedScriptId,
    search,
    loading,
    onSearchChange,
    onSelect,
    onDelete,
    onCreateNew,
    onRefresh,
}: ScriptsListProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(252,247,255,0.98))",
            }}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ArticleIcon color="secondary" />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Scripts
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {scripts.length} registros
                            </Typography>
                        </Box>
                    </Stack>
                    <Tooltip title="Recarregar">
                        <IconButton onClick={onRefresh} size="small">
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <TextField
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Buscar por chave ou descrição"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateNew}>
                    Novo script
                </Button>
            </Stack>

            <Divider />

            <Box sx={{ overflowY: "auto", flex: 1, pr: 0.5 }}>
                <List disablePadding sx={{ display: "grid", gap: 1 }}>
                    {loading ? (
                        <Stack spacing={1}>
                            <Skeleton variant="rounded" height={76} />
                            <Skeleton variant="rounded" height={76} />
                            <Skeleton variant="rounded" height={76} />
                        </Stack>
                    ) : scripts.length > 0 ? (
                        scripts.map((script) => {
                            const isSelected = selectedScriptId === script.id;
                            const dependencyCount = script.dependencies?.length ?? 0;

                            return (
                                <ListItemButton
                                    key={script.id}
                                    selected={isSelected}
                                    onClick={() => onSelect(script.id)}
                                    sx={{
                                        borderRadius: 2,
                                        border: "1px solid",
                                        borderColor: isSelected ? "secondary.main" : "rgba(111,66,193,0.16)",
                                        alignItems: "flex-start",
                                        backgroundColor: isSelected ? "rgba(216,180,254,0.18)" : "rgba(255,255,255,0.82)",
                                        boxShadow: isSelected ? "0 10px 24px rgba(168,85,247,0.08)" : "none",
                                        transition: "transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease",
                                        "&:hover": {
                                            backgroundColor: "rgba(216,180,254,0.12)",
                                            transform: "translateY(-1px)",
                                        },
                                    }}
                                >
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {script.key || "Sem chave"}
                                            </Typography>
                                            <Chip size="small" label={`#${script.id}`} color="secondary" variant="outlined" />
                                        </Stack>
                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                                            <Chip size="small" label={`${dependencyCount} deps`} />
                                            <Typography variant="body2" color="text.secondary" sx={{ width: "100%" }}>
                                                {script.descricao || "Sem descrição"}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                    <Tooltip title="Excluir script">
                                        <IconButton
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onDelete(script.id);
                                            }}
                                            size="small"
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </ListItemButton>
                            );
                        })
                    ) : (
                        <EmptyState
                            icon={<ArticleIcon fontSize="small" />}
                            title="Nenhum script encontrado"
                            description="Crie um módulo Lua ou ajuste a busca para continuar."
                            actionLabel="Criar script"
                            onAction={onCreateNew}
                        />
                    )}
                </List>
            </Box>
        </Paper>
    );
}
