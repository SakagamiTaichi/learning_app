import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";
import LearningList from "./components/LearningList";
import LearningForm from "./components/LearningForm";
import Login from "./components/Login";

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
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LearningList />} />
          <Route path="/add" element={<LearningForm mode="add" />} />
          <Route path="/edit/:id" element={<LearningForm mode="edit" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
