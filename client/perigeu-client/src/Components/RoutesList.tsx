import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import RouteIcon from "@mui/icons-material/AltRoute";
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
import type { Route } from "../Types/Route";

type RoutesListProps = {
    routes: Route[];
    selectedRouteId: number | null;
    search: string;
    loading?: boolean;
    onSearchChange: (value: string) => void;
    onSelect: (routeId: number) => void;
    onDelete: (routeId: number) => void;
    onCreateNew: () => void;
    onRefresh: () => void;
};

export default function RoutesList({
    routes,
    selectedRouteId,
    search,
    loading,
    onSearchChange,
    onSelect,
    onDelete,
    onCreateNew,
    onRefresh,
}: RoutesListProps) {
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
                    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,245,255,0.98))",
            }}
        >
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <RouteIcon color="primary" />
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Rotas
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {routes.length} registros
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
                    placeholder="Buscar por path ou método"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />

                <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateNew}>
                    Nova rota
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
                    ) : routes.length > 0 ? (
                        routes.map((route) => {
                            const isSelected = selectedRouteId === route.id;
                            const scriptCount = route.scripts?.length ?? 0;

                            return (
                                <ListItemButton
                                    key={route.id}
                                    selected={isSelected}
                                    onClick={() => onSelect(route.id)}
                                    sx={{
                                        borderRadius: 2,
                                        border: "1px solid",
                                        borderColor: isSelected ? "primary.main" : "rgba(111,66,193,0.16)",
                                        alignItems: "flex-start",
                                        backgroundColor: isSelected ? "rgba(111,66,193,0.08)" : "rgba(255,255,255,0.8)",
                                        boxShadow: isSelected ? "0 10px 24px rgba(111,66,193,0.08)" : "none",
                                        transition: "transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease",
                                        "&:hover": {
                                            backgroundColor: "rgba(111,66,193,0.06)",
                                            transform: "translateY(-1px)",
                                        },
                                    }}
                                >
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography variant="subtitle2" fontWeight={700}>
                                                {route.path || "Sem path"}
                                            </Typography>
                                            <Chip size="small" label={route.method} color="primary" variant="outlined" />
                                        </Stack>
                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                                            <Chip size="small" label={`#${route.id}`} variant="outlined" />
                                            <Chip size="small" label={`${scriptCount} scripts`} />
                                        </Stack>
                                    </Box>
                                    <Tooltip title="Excluir rota">
                                        <IconButton
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onDelete(route.id);
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
                            icon={<RouteIcon fontSize="small" />}
                            title="Nenhuma rota encontrada"
                            description="Crie uma nova rota ou ajuste o filtro de busca para localizar um item existente."
                            actionLabel="Criar rota"
                            onAction={onCreateNew}
                        />
                    )}
                </List>
            </Box>
        </Paper>
    );
}
