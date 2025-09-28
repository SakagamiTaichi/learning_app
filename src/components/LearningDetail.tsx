import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  Autocomplete,
  Chip,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack,
} from "@mui/icons-material";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

interface QAPair {
  question: string;
  answer: string;
}

interface LearningData {
  topic: string;
  content?: string;
  qaPairs?: QAPair[];
  createdAt: Date;
  reviewDate?: Date;
  relatedLearnings?: string[];
}

interface LearningListItem {
  id: string;
  topic: string;
}

const LearningDetail: React.FC = () => {
  const [learning, setLearning] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [availableLearnings, setAvailableLearnings] = useState<
    LearningListItem[]
  >([]);
  const [contentVisible, setContentVisible] = useState(false);
  const [currentQAIndex, setCurrentQAIndex] = useState(0);
  const [reviewInterval, setReviewInterval] = useState<string>("");
  const [studyComplete, setStudyComplete] = useState(false);

  // Edit form states
  const [editTopic, setEditTopic] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editQaPairs, setEditQaPairs] = useState<QAPair[]>([{ question: "", answer: "" }]);
  const [editRelatedLearnings, setEditRelatedLearnings] = useState<string[]>(
    []
  );

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

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        navigate("/");
        return;
      }

      try {
        // Fetch learning data
        const docRef = doc(db, "learnings", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setAlert({
            open: true,
            message: "指定された学習内容が見つかりませんでした。",
            severity: "error",
          });
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        const data = docSnap.data();
        const learningData = {
          ...data,
          createdAt: data.createdAt.toDate(),
          reviewDate: data.reviewDate ? data.reviewDate.toDate() : undefined,
        } as LearningData;

        setLearning(learningData);
        setEditTopic(learningData.topic);
        setEditContent(learningData.content || "");
        setEditQaPairs(learningData.qaPairs && learningData.qaPairs.length > 0 ? learningData.qaPairs : [{ question: "", answer: "" }]);
        setEditRelatedLearnings(learningData.relatedLearnings || []);

        // Fetch available learnings for related learnings
        const q = query(
          collection(db, "learnings"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const learningsList = querySnapshot.docs
          .filter((doc) => doc.id !== id)
          .map((doc) => ({
            id: doc.id,
            topic: doc.data().topic,
          }));

        setAvailableLearnings(learningsList);
      } catch (error) {
        console.error("Error fetching learning: ", error);
        setAlert({
          open: true,
          message: "データの取得中にエラーが発生しました。",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditStart = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleEditCancel = () => {
    if (!learning) return;
    setIsEditing(false);
    setEditTopic(learning.topic);
    setEditContent(learning.content || "");
    setEditQaPairs(learning.qaPairs && learning.qaPairs.length > 0 ? learning.qaPairs : [{ question: "", answer: "" }]);
    setEditRelatedLearnings(learning.relatedLearnings || []);
  };

  const handleEditSave = async () => {
    if (!id || !editTopic.trim()) {
      setAlert({
        open: true,
        message: "トピックを入力してください。",
        severity: "error",
      });
      return;
    }

    const hasValidQA = editQaPairs.some(pair => pair.question.trim() && pair.answer.trim());
    if (!hasValidQA) {
      setAlert({
        open: true,
        message: "少なくとも1つの問題と解答を入力してください。",
        severity: "error",
      });
      return;
    }

    const validQaPairs = editQaPairs.filter(pair => pair.question.trim() && pair.answer.trim());

    setSaveLoading(true);
    try {
      const docRef = doc(db, "learnings", id);
      await updateDoc(docRef, {
        topic: editTopic.trim(),
        content: editContent.trim() || undefined,
        qaPairs: validQaPairs,
        relatedLearnings: editRelatedLearnings,
      });

      setLearning((prev) =>
        prev
          ? {
              ...prev,
              topic: editTopic.trim(),
              content: editContent.trim() || undefined,
              qaPairs: validQaPairs,
              relatedLearnings: editRelatedLearnings,
            }
          : null
      );

      setIsEditing(false);
      setAlert({
        open: true,
        message: "学習内容が正常に更新されました！",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating learning: ", error);
      setAlert({
        open: true,
        message: "更新中にエラーが発生しました。",
        severity: "error",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!id) return;

    setSaveLoading(true);
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
      console.error("Error deleting learning: ", error);
      setAlert({
        open: true,
        message: "削除中にエラーが発生しました。",
        severity: "error",
      });
    } finally {
      setSaveLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleStudyComplete = async () => {
    if (!reviewInterval || !id) return;

    const selectedOption = reviewOptions.find(
      (opt) => opt.value === reviewInterval
    );
    if (!selectedOption) return;

    setSaveLoading(true);
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
      setSaveLoading(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleAddQAPair = () => {
    setEditQaPairs([...editQaPairs, { question: "", answer: "" }]);
  };

  const handleRemoveQAPair = (index: number) => {
    if (editQaPairs.length > 1) {
      setEditQaPairs(editQaPairs.filter((_, i) => i !== index));
    }
  };

  const handleQAPairChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newQaPairs = [...editQaPairs];
    newQaPairs[index][field] = value;
    setEditQaPairs(newQaPairs);
  };

  const handleNextQA = () => {
    if (learning?.qaPairs && currentQAIndex < learning.qaPairs.length - 1) {
      setCurrentQAIndex(currentQAIndex + 1);
      setContentVisible(false);
    }
  };

  const handlePrevQA = () => {
    if (currentQAIndex > 0) {
      setCurrentQAIndex(currentQAIndex - 1);
      setContentVisible(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner message="学習内容を読み込み中..." size={50} />
      </Box>
    );
  }

  if (!learning) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        p: { xs: 2, sm: 3 },
        width: "100%",
        margin: 0,
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 3,
          minHeight: "calc(100vh - 128px)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <Button
          onClick={() => navigate("/")}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            borderRadius: 2,
            px: 2,
          }}
        >
          戻る
        </Button>

        <IconButton
          onClick={handleMenuOpen}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
          }}
        >
          <MoreVertIcon />
        </IconButton>

        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditStart}>
            <EditIcon sx={{ mr: 1 }} />
            編集
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
            <DeleteIcon sx={{ mr: 1 }} />
            削除
          </MenuItem>
        </Menu>

        {isEditing ? (
          <Box sx={{ mt: 16 }}>
            <TextField
              fullWidth
              label="トピック"
              variant="outlined"
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              margin="normal"
              required
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              helperText={`${editTopic.length}/100文字`}
            />

            <TextField
              fullWidth
              label="補足メモ"
              variant="outlined"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              margin="normal"
              multiline
              minRows={4}
              maxRows={10}
              sx={{ mb: 3 }}
              slotProps={{ htmlInput: { maxLength: 3000 } }}
              helperText={`${editContent.length}/3000文字（オプション）`}
            />

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">
                  問題と解答
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddQAPair}
                >
                  問題を追加
                </Button>
              </Box>

              {editQaPairs.map((pair, index) => (
                <Box key={index} sx={{ mb: 3, p: 2, backgroundColor: "grey.50", borderRadius: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2">問題 {index + 1}</Typography>
                    {editQaPairs.length > 1 && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<RemoveIcon />}
                        onClick={() => handleRemoveQAPair(index)}
                      >
                        削除
                      </Button>
                    )}
                  </Box>
                  <TextField
                    fullWidth
                    label="問題"
                    value={pair.question}
                    onChange={(e) => handleQAPairChange(index, 'question', e.target.value)}
                    margin="normal"
                    multiline
                    minRows={2}
                    slotProps={{ htmlInput: { maxLength: 1000 } }}
                    helperText={`${pair.question.length}/1000文字`}
                  />
                  <TextField
                    fullWidth
                    label="解答"
                    value={pair.answer}
                    onChange={(e) => handleQAPairChange(index, 'answer', e.target.value)}
                    margin="normal"
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { maxLength: 2000 } }}
                    helperText={`${pair.answer.length}/2000文字`}
                  />
                </Box>
              ))}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <LinkIcon sx={{ mr: 1 }} />
                関連学習内容
              </Typography>

              <Autocomplete
                multiple
                options={availableLearnings}
                getOptionLabel={(option) => option.topic}
                value={
                  editRelatedLearnings.length > 0 &&
                  availableLearnings.length > 0
                    ? availableLearnings.filter((learning) =>
                        editRelatedLearnings.includes(learning.id)
                      )
                    : []
                }
                onChange={(_, newValue) => {
                  setEditRelatedLearnings(newValue.map((item) => item.id));
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
              sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}
            >
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleEditCancel}
                disabled={saveLoading}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleEditSave}
                disabled={saveLoading}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  borderRadius: 2,
                }}
              >
                {saveLoading ? "保存中..." : "保存"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 16 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                復習設定:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>復習期限を選択</InputLabel>
                  <Select
                    value={reviewInterval}
                    label="復習期限を選択"
                    onChange={(e) => setReviewInterval(e.target.value)}
                    disabled={studyComplete}
                  >
                    {reviewOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  disabled={saveLoading || !reviewInterval || studyComplete}
                  onClick={handleStudyComplete}
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontSize: "1rem",
                    borderRadius: 2,
                  }}
                >
                  {saveLoading
                    ? "設定中..."
                    : studyComplete
                    ? "完了しました"
                    : "学習完了"}
                </Button>
              </Box>
            </Box>
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
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
                >
                  {learning.topic}
                </Typography>
              </Paper>
            </Box>

            {learning.content && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  補足メモ:
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: "grey.50",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
                  >
                    {learning.content}
                  </Typography>
                </Paper>
              </Box>
            )}

            {learning.qaPairs && learning.qaPairs.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2
                }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    問題 {currentQAIndex + 1} / {learning.qaPairs.length}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handlePrevQA}
                      disabled={currentQAIndex === 0}
                      startIcon={<ArrowBack />}
                    >
                      前へ
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleNextQA}
                      disabled={currentQAIndex === learning.qaPairs.length - 1}
                      endIcon={<ArrowForwardIcon />}
                    >
                      次へ
                    </Button>
                  </Box>
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    minHeight: "150px",
                    backgroundColor: "white",
                    mb: 2,
                    border: "2px solid",
                    borderColor: "primary.200"
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1, color: "grey.600", fontWeight: 600 }}>
                    問題:
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontWeight: 500 }}
                  >
                    {learning.qaPairs[currentQAIndex]?.question}
                  </Typography>
                </Paper>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ mr: 2, fontWeight: "bold", color: "success.dark" }}>
                    解答:
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    color="success"
                    startIcon={
                      contentVisible ? <VisibilityOffIcon /> : <VisibilityIcon />
                    }
                    onClick={() => setContentVisible(!contentVisible)}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      py: 0.5,
                    }}
                  >
                    {contentVisible ? "解答を隠す" : "解答を表示"}
                  </Button>
                </Box>

                {contentVisible && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      minHeight: "150px",
                      backgroundColor: "success.50",
                      border: "2px solid",
                      borderColor: "success.200"
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
                    >
                      {learning.qaPairs[currentQAIndex]?.answer}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {learning.relatedLearnings &&
              learning.relatedLearnings.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <LinkIcon sx={{ mr: 1 }} />
                    関連学習内容
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {learning.relatedLearnings.map((relatedId) => {
                      const relatedLearning = availableLearnings.find(
                        (learning) => learning.id === relatedId
                      );
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
                            onClick={() => navigate(`/detail/${relatedId}`)}
                            sx={{ p: 2 }}
                          >
                            <CardContent sx={{ p: 0 }}>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: "medium" }}
                              >
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
        <DialogTitle id="delete-dialog-title">学習内容を削除</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            この学習内容を削除してもよろしいですか？
            <br />
            <strong>"{learning.topic}"</strong>
            <br />
            この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={saveLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={saveLoading}
            autoFocus
          >
            {saveLoading ? "削除中..." : "削除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LearningDetail;
