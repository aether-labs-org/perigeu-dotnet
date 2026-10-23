import { alpha, createTheme, responsiveFontSizes, type Theme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#6f42c1",
            light: "#9a7bdb",
            dark: "#4e2e91",
            contrastText: "#ffffff",
        },
        secondary: {
            main: "#d8b4fe",
            light: "#ede0ff",
            dark: "#a855f7",
            contrastText: "#45266c",
        },
        success: {
            main: "#7ccba2",
        },
        warning: {
            main: "#f4c76a",
        },
        background: {
            default: "#ffffff",
            paper: "#fffafc",
        },
        text: {
            primary: "#2d2340",
            secondary: "#6d6287",
        },
    },
    shape: {
        borderRadius: 16,
    },
    shadows: [
        "none",
        "0 2px 8px rgba(111, 66, 193, 0.05)",
        "0 8px 24px rgba(111, 66, 193, 0.08)",
        "0 14px 32px rgba(111, 66, 193, 0.12)",
        "0 20px 40px rgba(111, 66, 193, 0.14)",
        ...Array(20).fill("0 20px 40px rgba(111, 66, 193, 0.14)"),
    ] as Theme["shadows"],
    typography: {
        fontFamily: '"Inter", "IBM Plex Sans", "Segoe UI", sans-serif',
        h1: {
            fontWeight: 700,
            letterSpacing: "-0.04em",
        },
        h2: {
            fontWeight: 700,
            letterSpacing: "-0.03em",
        },
        h3: {
            fontWeight: 700,
        },
        h4: {
            fontWeight: 650,
        },
        button: {
            textTransform: "none",
            fontWeight: 700,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: "#ffffff",
                    backgroundImage: [
                        "radial-gradient(circle at top left, rgba(111, 66, 193, 0.10), transparent 26%)",
                        "radial-gradient(circle at top right, rgba(216, 180, 254, 0.18), transparent 22%)",
                        "linear-gradient(180deg, #ffffff 0%, #fbf8ff 100%)",
                    ].join(", "),
                    backgroundAttachment: "fixed",
                },
                "*::-webkit-scrollbar": {
                    width: 10,
                    height: 10,
                },
                "*::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha("#6f42c1", 0.28),
                    borderRadius: 999,
                    border: "2px solid transparent",
                    backgroundClip: "content-box",
                },
                "*::-webkit-scrollbar-track": {
                    backgroundColor: alpha("#6f42c1", 0.04),
                },
                "::selection": {
                    backgroundColor: alpha("#6f42c1", 0.18),
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${alpha("#6f42c1", 0.12)}`,
                    boxShadow: "0 10px 32px rgba(111, 66, 193, 0.08)",
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background:
                        "linear-gradient(135deg, rgba(111,66,193,0.98), rgba(155,124,219,0.94))",
                    color: "#ffffff",
                    backdropFilter: "blur(18px)",
                    borderBottom: `1px solid ${alpha("#4e2e91", 0.24)}`,
                    boxShadow: "0 10px 30px rgba(111, 66, 193, 0.18)",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                },
                outlined: {
                    borderColor: alpha("#6f42c1", 0.28),
                    backgroundColor: alpha("#ffffff", 0.75),
                },
                contained: {
                    boxShadow: "0 10px 20px rgba(111, 66, 193, 0.18)",
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                outlined: {
                    backgroundColor: alpha("#f5f0ff", 0.8),
                },
                root: {
                    fontWeight: 600,
                },
            },
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    borderColor: alpha("#6f42c1", 0.1),
                },
            },
        },
        MuiAccordion: {
            styleOverrides: {
                root: {
                    border: `1px solid ${alpha("#6f42c1", 0.12)}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(111, 66, 193, 0.06)",
                    "&:before": {
                        display: "none",
                    },
                    "&.Mui-expanded": {
                        margin: 0,
                    },
                },
            },
        },
        MuiAccordionSummary: {
            styleOverrides: {
                root: {
                    paddingInline: 20,
                },
                content: {
                    marginBlock: 16,
                },
            },
        },
        MuiAccordionDetails: {
            styleOverrides: {
                root: {
                    paddingInline: 20,
                    paddingBottom: 20,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    minHeight: 48,
                    textTransform: "none",
                    fontWeight: 700,
                    color: alpha("#ffffff", 0.9),
                    "&.Mui-selected": {
                        color: "#ffffff",
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: "#ffffff",
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#6f42c1",
                    },
                },
                notchedOutline: {
                    borderColor: alpha("#6f42c1", 0.18),
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                size: "small",
                fullWidth: true,
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: 3,
                    borderRadius: 999,
                },
            },
        },
    },
});

export default responsiveFontSizes(theme);
