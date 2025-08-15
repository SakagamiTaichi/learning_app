import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Snackbar,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";

interface LearningData {
  topic: string;
  content: string;
  createdAt: Date;
}

interface LearningFormProps {
  mode: "add" | "edit";
}

const LearningForm: React.FC<LearningFormProps> = ({ mode }) => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(mode === "edit");
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (mode === "edit" && id) {
      const fetchLearning = async () => {
        try {
          const docRef = doc(db, "learnings", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setTopic(data.topic);
            setContent(data.content);
          } else {
            setAlert({
              open: true,
              message: "指定された学習内容が見つかりませんでした。",
              severity: "error",
            });
            setTimeout(() => navigate("/"), 2000);
          }
        } catch (error) {
          console.error("Error fetching document: ", error);
          setAlert({
            open: true,
            message: "データの取得中にエラーが発生しました。",
            severity: "error",
          });
        } finally {
          setFetchLoading(false);
        }
      };

      fetchLearning();
    }
  }, [mode, id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim() || !content.trim()) {
      setAlert({
        open: true,
        message: "トピックと学習内容の両方を入力してください。",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === "add") {
        const learningData: LearningData = {
          topic: topic.trim(),
          content: content.trim(),
          createdAt: new Date(),
        };

        await addDoc(collection(db, "learnings"), learningData);

        setAlert({
          open: true,
          message: "学習内容が正常に保存されました！",
          severity: "success",
        });

        setTopic("");
        setContent("");
      } else if (mode === "edit" && id) {
        const docRef = doc(db, "learnings", id);
        await updateDoc(docRef, {
          topic: topic.trim(),
          content: content.trim(),
        });

        setAlert({
          open: true,
          message: "学習内容が正常に更新されました！",
          severity: "success",
        });

        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      console.error("Error saving document: ", error);
      setAlert({
        open: true,
        message: "保存中にエラーが発生しました。もう一度お試しください。",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleBack = () => {
    navigate("/");
  };

  if (fetchLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4, md: 6 },
          borderRadius: 2,
          minHeight: "calc(100vh - 32px)",
          width: "calc(100vw - 32px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <IconButton
          onClick={handleBack}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            bgcolor: "background.paper",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            textAlign: "center",
            mb: 3,
            fontSize: { xs: "1.75rem", sm: "2rem", md: "2.125rem" },
          }}
        >
          {mode === "add" ? "新規学習内容登録" : "学習内容編集"}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="トピック"
            variant="outlined"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            margin="normal"
            required
            sx={{ mb: 2 }}
            slotProps={{ htmlInput: { maxLength: 100 } }}
            helperText={`${topic.length}/100文字`}
          />

          <TextField
            fullWidth
            label="学習内容"
            variant="outlined"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            margin="normal"
            required
            multiline
            rows={18}
            sx={{ mb: 3 }}
            slotProps={{ htmlInput: { maxLength: 3000 } }}
            helperText={`${content.length}/3000文字`}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 2,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                px: { xs: 3, sm: 6 },
                py: 1.5,
                fontSize: "1.1rem",
                borderRadius: 2,
                minWidth: { xs: "200px", sm: "250px" },
              }}
            >
              {loading
                ? mode === "add"
                  ? "保存中..."
                  : "更新中..."
                : mode === "add"
                  ? "学習内容を保存"
                  : "学習内容を更新"}
            </Button>
          </Box>
        </Box>
      </Paper>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LearningForm;