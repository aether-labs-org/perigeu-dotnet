import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";

type EmptyStateProps = {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: ReactNode;
};

export default function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 2.5,
                borderStyle: "dashed",
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(251,248,255,0.96))",
                borderColor: alpha("#6f42c1", 0.18),
            }}
        >
            <Stack spacing={1.5} alignItems="flex-start">
                {icon ? (
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            display: "grid",
                            placeItems: "center",
                            color: "primary.main",
                            backgroundColor: "rgba(111,66,193,0.08)",
                        }}
                    >
                        {icon}
                    </Box>
                ) : null}
                <Box>
                    <Typography variant="subtitle1" fontWeight={800}>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                </Box>
                {actionLabel && onAction ? (
                    <Button variant="contained" size="small" onClick={onAction}>
                        {actionLabel}
                    </Button>
                ) : null}
            </Stack>
        </Paper>
    );
}
