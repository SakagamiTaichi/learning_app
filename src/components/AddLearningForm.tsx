import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Snackbar,
} from "@mui/material";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

interface LearningData {
  topic: string;
  content: string;
  createdAt: Date;
}

const AddLearningForm: React.FC = () => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

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
    } catch (error) {
      console.error("Error adding document: ", error);
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
        }}
      >
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
          新規学習内容登録
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
              {loading ? "保存中..." : "学習内容を保存"}
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

export default AddLearningForm;
