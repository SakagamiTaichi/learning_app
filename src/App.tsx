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
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
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
        },
        '#root': {
          margin: 0,
          padding: 0,
          width: '100%',
          minHeight: '100vh',
        }
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
