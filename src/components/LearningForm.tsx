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
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from "@mui/icons-material";
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
  reviewDate?: Date;
}

interface LearningFormProps {
  mode: "add" | "edit" | "study";
}

const LearningForm: React.FC<LearningFormProps> = ({ mode }) => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(mode === "edit" || mode === "study");
  const [currentMode, setCurrentMode] = useState(mode);
  const [reviewInterval, setReviewInterval] = useState<string>("");
  const [contentVisible, setContentVisible] = useState(mode !== "study");
  const [studyComplete, setStudyComplete] = useState(false);
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
    if ((mode === "edit" || mode === "study") && id) {
      const fetchLearning = async () => {
        try {
          const docRef = doc(db, "learnings", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setTopic(data.topic);
            setContent(data.content);
            if (mode === "study") {
              setContentVisible(false);
            }
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

  const reviewOptions = [
    { value: "immediate", label: "即時", days: 0 },
    { value: "1day", label: "1日後", days: 1 },
    { value: "5days", label: "5日後", days: 5 },
    { value: "20days", label: "20日後", days: 20 },
    { value: "unlimited", label: "無期限", days: null },
  ];

  const calculateReviewDate = (days: number | null): Date | undefined => {
    if (days === null) return undefined;
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + days);
    return reviewDate;
  };

  const handleModeChange = (newMode: "edit" | "study") => {
    setCurrentMode(newMode);
    if (newMode === "study") {
      setContentVisible(false);
      setStudyComplete(false);
    } else {
      setContentVisible(true);
    }
  };

  const handleStudyComplete = async () => {
    if (!reviewInterval || !id) return;

    const selectedOption = reviewOptions.find(opt => opt.value === reviewInterval);
    if (!selectedOption) return;

    setLoading(true);
    try {
      const docRef = doc(db, "learnings", id);
      const reviewDate = calculateReviewDate(selectedOption.days);
      
      await updateDoc(docRef, {
        reviewDate: reviewDate || null,
      });

      setAlert({
        open: true,
        message: `復習期限を${selectedOption.label}に設定しました！`,
        severity: "success",
      });

      setStudyComplete(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error updating review date: ", error);
      setAlert({
        open: true,
        message: "復習期限の設定中にエラーが発生しました。",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

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
      } else if (currentMode === "edit" && id) {
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
          {mode === "add" ? "新規学習内容登録" : currentMode === "study" ? "学習モード" : "学習内容編集"}
        </Typography>

        {(mode === "edit" || mode === "study") && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <ToggleButtonGroup
              value={currentMode}
              exclusive
              onChange={(_, newMode) => newMode && handleModeChange(newMode)}
              aria-label="mode selection"
            >
              <ToggleButton value="edit" aria-label="edit mode">
                編集モード
              </ToggleButton>
              <ToggleButton value="study" aria-label="study mode">
                学習モード
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {currentMode === "study" ? (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ mr: 2 }}>
                トピック:
              </Typography>
              <Chip label={topic} color="primary" variant="outlined" />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ mr: 2 }}>
                  学習内容:
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={contentVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={() => setContentVisible(!contentVisible)}
                >
                  {contentVisible ? "内容を隠す" : "内容を表示"}
                </Button>
              </Box>

              {contentVisible && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minHeight: "200px",
                    backgroundColor: "grey.50",
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                    {content}
                  </Typography>
                </Paper>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>復習期限を選択</InputLabel>
                <Select
                  value={reviewInterval}
                  label="復習期限を選択"
                  onChange={(e) => setReviewInterval(e.target.value)}
                >
                  {reviewOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                disabled={loading || !reviewInterval || studyComplete}
                onClick={handleStudyComplete}
                sx={{
                  px: { xs: 3, sm: 6 },
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                  minWidth: { xs: "200px", sm: "250px" },
                }}
              >
                {loading ? "設定中..." : studyComplete ? "完了しました" : "学習完了"}
              </Button>
            </Box>
          </Box>
        ) : (
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
        )}
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