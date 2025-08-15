import { ThemeProvider, createTheme, CssBaseline, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import LoadingSpinner from "./components/LoadingSpinner";

const LearningList = lazy(() => import("./components/LearningList"));
const LearningForm = lazy(() => import("./components/LearningForm"));
const LearningDetail = lazy(() => import("./components/LearningDetail"));
const Login = lazy(() => import("./components/Login"));
const Header = lazy(() => import("./components/Header"));

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563eb",
      light: "#60a5fa",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#dc2626",
      light: "#f87171",
      dark: "#991b1b",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    grey: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    h1: {
      fontSize: "2.25rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontSize: "1.875rem",
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: "-0.015em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      color: "#64748b",
    },
    button: {
      fontWeight: 500,
      letterSpacing: "0.025em",
      textTransform: "none",
    },
  },
  spacing: 4,
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    "0 32px 64px -12px rgb(0 0 0 / 0.4)",
    "0 0 0 1px rgb(0 0 0 / 0.05), 0 0 2px 0 rgb(0 0 0 / 0.1)",
    "0 0 0 1px rgb(0 0 0 / 0.05), 0 0 4px 0 rgb(0 0 0 / 0.1)",
    "0 0 0 1px rgb(0 0 0 / 0.05), 0 0 8px 0 rgb(0 0 0 / 0.15)",
    "0 0 0 1px rgb(0 0 0 / 0.05), 0 0 16px 0 rgb(0 0 0 / 0.2)",
    "0 0 0 1px rgb(0 0 0 / 0.05), 0 0 32px 0 rgb(0 0 0 / 0.25)",
    "0 0 0 1px rgb(0 0 0 / 0.05), 0 0 64px 0 rgb(0 0 0 / 0.3)",
    "0 0 0 1px rgb(0 0 0 / 0.05), 0 0 128px 0 rgb(0 0 0 / 0.35)",
    "0 25px 50px -12px rgb(0 0 0 / 0.35)",
    "0 32px 64px -12px rgb(0 0 0 / 0.45)",
    "0 40px 80px -12px rgb(0 0 0 / 0.5)",
    "0 48px 96px -12px rgb(0 0 0 / 0.55)",
    "0 56px 112px -12px rgb(0 0 0 / 0.6)",
    "0 64px 128px -12px rgb(0 0 0 / 0.65)",
    "0 72px 144px -12px rgb(0 0 0 / 0.7)",
    "0 80px 160px -12px rgb(0 0 0 / 0.75)",
    "0 88px 176px -12px rgb(0 0 0 / 0.8)",
    "0 96px 192px -12px rgb(0 0 0 / 0.85)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
        },
        body: {
          margin: 0,
          padding: 0,
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        },
        '#root': {
          margin: 0,
          padding: 0,
          width: '100%',
          minHeight: '100vh',
        }
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#94a3b8',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
        elevation3: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.default',
          }}
        >
          <LoadingSpinner message="アプリを読み込み中..." size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Suspense fallback={<LoadingSpinner message="ログインページを読み込み中..." size={60} />}>
          <Login />
        </Suspense>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          minHeight: '100vh', 
          width: '100%',
          margin: 0,
          padding: 0,
          backgroundColor: 'background.default' 
        }}>
          <Suspense fallback={<LoadingSpinner message="ヘッダーを読み込み中..." size={40} />}>
            <Header userEmail={user?.email || ''} />
          </Suspense>
          <Suspense fallback={<LoadingSpinner message="ページを読み込み中..." size={60} />}>
            <Routes>
              <Route path="/" element={<LearningList />} />
              <Route path="/add" element={<LearningForm mode="add" />} />
              <Route path="/detail/:id" element={<LearningDetail />} />
              <Route path="/study/:id" element={<LearningForm mode="study" />} />
            </Routes>
          </Suspense>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
