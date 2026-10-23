import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CodeIcon from "@mui/icons-material/Code";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Divider,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { sandboxSections } from "../data/sandboxDocs";

export default function Doc() {
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 3,
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(251,248,255,0.98))",
            }}
        >
            <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <AutoAwesomeIcon color="primary" />
                    <Typography variant="h4" fontWeight={800}>
                        Sandbox Lua
                    </Typography>
                </Stack>
                <Typography variant="body1" color="text.secondary" maxWidth={900}>
                    O runtime expõe helpers para request, banco, cache, logs, HTTP, JSON, data e composição de scripts.
                    A documentação abaixo reflete o contrato disponível no client.
                </Typography>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
                {sandboxSections.map((section) => (
                    <Chip key={section.title} label={section.title} size="small" variant="outlined" />
                ))}
            </Stack>

            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                }}
            >
                {sandboxSections.map((section) => (
                    <Accordion key={section.title} disableGutters elevation={0}>
                        <AccordionSummary>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <CodeIcon color="secondary" />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {section.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {section.summary}
                                    </Typography>
                                </Box>
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <Divider />
                                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                                    {section.items.map((item) => (
                                        <Box component="li" key={item} sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {item}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        backgroundColor: "rgba(111,66,193,0.04)",
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <Chip label="Exemplo" size="small" color="primary" variant="outlined" />
                                    </Stack>
                                    <Box
                                        component="pre"
                                        sx={{
                                            m: 0,
                                            whiteSpace: "pre-wrap",
                                            fontFamily:
                                                '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
                                            fontSize: 13,
                                            lineHeight: 1.7,
                                            color: "text.primary",
                                        }}
                                    >
                                        {section.example}
                                    </Box>
                                </Paper>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Paper>
    );
}
