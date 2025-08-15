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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Autocomplete,
  Card,
  CardContent,
  CardActionArea,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Delete as DeleteIcon, Link as LinkIcon } from "@mui/icons-material";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";

interface LearningData {
  topic: string;
  content: string;
  createdAt: Date;
  reviewDate?: Date;
  relatedLearnings?: string[];
}

interface LearningFormProps {
  mode: "add" | "edit" | "study" | "view";
}

interface LearningListItem {
  id: string;
  topic: string;
}

const LearningForm: React.FC<LearningFormProps> = ({ mode }) => {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(mode === "edit" || mode === "study" || mode === "view");
  const [currentMode, setCurrentMode] = useState(mode);
  const [reviewInterval, setReviewInterval] = useState<string>("");
  const [contentVisible, setContentVisible] = useState(mode !== "study");
  const [studyComplete, setStudyComplete] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [relatedLearnings, setRelatedLearnings] = useState<string[]>([]);
  const [availableLearnings, setAvailableLearnings] = useState<LearningListItem[]>([]);
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
    const fetchAvailableLearnings = async () => {
      try {
        const q = query(
          collection(db, "learnings"),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const learningsList = querySnapshot.docs
          .filter((doc) => doc.id !== id) // 自分自身を除外
          .map((doc) => ({
            id: doc.id,
            topic: doc.data().topic,
          }));
        
        setAvailableLearnings(learningsList);
      } catch (error) {
        console.error("Error fetching available learnings: ", error);
      }
    };

    const fetchLearning = async () => {
      if ((mode === "edit" || mode === "study" || mode === "view") && id) {
        try {
          const docRef = doc(db, "learnings", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setTopic(data.topic);
            setContent(data.content);
            setRelatedLearnings(data.relatedLearnings || []);
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
      } else {
        setFetchLoading(false);
      }
    };

    fetchAvailableLearnings();
    fetchLearning();
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
          relatedLearnings: relatedLearnings,
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
          relatedLearnings: relatedLearnings,
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

  const handleDelete = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const docRef = doc(db, "learnings", id);
      await deleteDoc(docRef);

      setAlert({
        open: true,
        message: "学習内容を削除しました。",
        severity: "success",
      });

      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error deleting document: ", error);
      setAlert({
        open: true,
        message: "削除中にエラーが発生しました。",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
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
          {mode === "add" ? "新規学習内容登録" : currentMode === "study" ? "学習モード" : mode === "view" ? "学習内容詳細" : "学習内容編集"}
        </Typography>

        {(mode === "edit" || mode === "study" || mode === "view") && mode !== "view" && (
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
            rows={16}
            sx={{ mb: 3 }}
            slotProps={{ htmlInput: { maxLength: 3000 } }}
            helperText={`${content.length}/3000文字`}
          />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
              <LinkIcon sx={{ mr: 1 }} />
              関連学習内容
            </Typography>
            
            <Autocomplete
              multiple
              options={availableLearnings}
              getOptionLabel={(option) => option.topic}
              value={
                relatedLearnings.length > 0 && availableLearnings.length > 0
                  ? availableLearnings.filter(learning => relatedLearnings.includes(learning.id))
                  : []
              }
              onChange={(_, newValue) => {
                setRelatedLearnings(newValue.map(item => item.id));
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="関連する学習内容を選択..."
                  helperText="複数選択可能です"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      variant="outlined"
                      label={option.topic}
                      {...tagProps}
                    />
                  );
                })
              }
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
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
            
            {mode === "edit" && (
              <Button
                variant="outlined"
                size="large"
                color="error"
                startIcon={<DeleteIcon />}
                disabled={loading}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                }}
              >
                削除
              </Button>
            )}
          </Box>
        </Box>
        )} 

        {mode === "view" && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                トピック:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: "grey.50",
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: "medium" }}>
                  {topic}
                </Typography>
              </Paper>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                学習内容:
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  minHeight: "300px",
                  backgroundColor: "grey.50",
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                  {content}
                </Typography>
              </Paper>
            </Box>

            {relatedLearnings.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", display: "flex", alignItems: "center" }}>
                  <LinkIcon sx={{ mr: 1 }} />
                  関連学習内容
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {relatedLearnings.map((relatedId) => {
                    const relatedLearning = availableLearnings.find(learning => learning.id === relatedId);
                    if (!relatedLearning) return null;
                    
                    return (
                      <Card
                        key={relatedId}
                        sx={{
                          minWidth: "250px",
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardActionArea
                          onClick={() => navigate(`/view/${relatedId}`)}
                          sx={{ p: 2 }}
                        >
                          <CardContent sx={{ p: 0 }}>
                            <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                              {relatedLearning.topic}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(`/edit/${id}`)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                }}
              >
                編集
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate(`/study/${id}`)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                }}
              >
                学習モード
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          学習内容を削除
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            この学習内容を削除してもよろしいですか？
            <br />
            <strong>"{topic}"</strong>
            <br />
            この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
            autoFocus
          >
            {loading ? "削除中..." : "削除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LearningForm;