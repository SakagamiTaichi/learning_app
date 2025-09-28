import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Snackbar,
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
import LoadingSpinner from './LoadingSpinner';
import { ArrowBack as ArrowBackIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon, Delete as DeleteIcon, Link as LinkIcon } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchLearningById,
  fetchLearnings,
  addLearning,
  updateLearning,
  deleteLearning,
  clearCurrentLearning,
} from "../store/slices/learningSlice";
import { showAlert, hideAlert } from "../store/slices/uiSlice";

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
  const [currentMode, setCurrentMode] = useState(mode);
  const [reviewInterval, setReviewInterval] = useState<string>("");
  const [contentVisible, setContentVisible] = useState(mode !== "study");
  const [studyComplete, setStudyComplete] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [relatedLearnings, setRelatedLearnings] = useState<string[]>([]);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { loading, fetchLoading, learnings } = useAppSelector((state) => state.learning);
  const alert = useAppSelector((state) => state.ui.alert);

  const availableLearnings: LearningListItem[] = learnings
    .filter((learning) => learning.id !== id)
    .map((learning) => ({
      id: learning.id,
      topic: learning.topic,
    }));

  useEffect(() => {
    dispatch(fetchLearnings());

    if ((mode === "edit" || mode === "study" || mode === "view") && id) {
      dispatch(fetchLearningById(id)).then((result) => {
        if (fetchLearningById.fulfilled.match(result)) {
          const data = result.payload;
          setTopic(data.topic);
          setContent(data.content);
          setRelatedLearnings(data.relatedLearnings || []);
          if (mode === "study") {
            setContentVisible(false);
          }
        } else if (fetchLearningById.rejected.match(result)) {
          dispatch(showAlert({
            message: "指定された学習内容が見つかりませんでした。",
            severity: "error",
          }));
          setTimeout(() => navigate("/"), 2000);
        }
      });
    }

    return () => {
      dispatch(clearCurrentLearning());
    };
  }, [mode, id, navigate, dispatch]);

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

    const reviewDate = calculateReviewDate(selectedOption.days);

    dispatch(updateLearning({
      id,
      data: { reviewDate: reviewDate || undefined },
    })).then((result) => {
      if (updateLearning.fulfilled.match(result)) {
        dispatch(showAlert({
          message: `復習期限を${selectedOption.label}に設定しました！`,
          severity: "success",
        }));
        setStudyComplete(true);
        setTimeout(() => navigate("/"), 1500);
      } else {
        dispatch(showAlert({
          message: "復習期限の設定中にエラーが発生しました。",
          severity: "error",
        }));
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim() || !content.trim()) {
      dispatch(showAlert({
        message: "トピックと学習内容の両方を入力してください。",
        severity: "error",
      }));
      return;
    }

    if (mode === "add") {
      const learningData = {
        topic: topic.trim(),
        content: content.trim(),
        createdAt: new Date(),
        relatedLearnings: relatedLearnings,
      };

      dispatch(addLearning(learningData)).then((result) => {
        if (addLearning.fulfilled.match(result)) {
          dispatch(showAlert({
            message: "学習内容が正常に保存されました！",
            severity: "success",
          }));
          setTopic("");
          setContent("");
          setRelatedLearnings([]);
        } else {
          dispatch(showAlert({
            message: "保存中にエラーが発生しました。もう一度お試しください。",
            severity: "error",
          }));
        }
      });
    } else if (currentMode === "edit" && id) {
      dispatch(updateLearning({
        id,
        data: {
          topic: topic.trim(),
          content: content.trim(),
          relatedLearnings: relatedLearnings,
        },
      })).then((result) => {
        if (updateLearning.fulfilled.match(result)) {
          dispatch(showAlert({
            message: "学習内容が正常に更新されました！",
            severity: "success",
          }));
          setTimeout(() => navigate("/"), 1500);
        } else {
          dispatch(showAlert({
            message: "保存中にエラーが発生しました。もう一度お試しください。",
            severity: "error",
          }));
        }
      });
    }
  };

  const handleCloseAlert = () => {
    dispatch(hideAlert());
  };

  const handleDelete = async () => {
    if (!id) return;

    dispatch(deleteLearning(id)).then((result) => {
      if (deleteLearning.fulfilled.match(result)) {
        dispatch(showAlert({
          message: "学習内容を削除しました。",
          severity: "success",
        }));
        setTimeout(() => navigate("/"), 1500);
      } else {
        dispatch(showAlert({
          message: "削除中にエラーが発生しました。",
          severity: "error",
        }));
      }
      setDeleteDialogOpen(false);
    });
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
        <LoadingSpinner message="学習内容を読み込み中..." size={50} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)", // Subtract header height
        p: { xs: 2, sm: 3 },
        width: "100%",
        margin: 0,
        boxSizing: 'border-box',
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
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{
            position: "absolute",
            top: 20,
            left: 20,
            borderRadius: 2,
            px: 3,
            py: 1,
            fontWeight: 500,
            zIndex: 10,
            backgroundColor: "white",
            borderColor: "grey.300",
            color: "grey.700",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
            transition: "all 0.2s ease-in-out",
            '&:hover': {
              backgroundColor: "grey.50",
              borderColor: "grey.400",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            },
            '&:focus': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
            },
          }}
        >
          戻る
        </Button>


        {(mode === "edit" || mode === "study" || mode === "view") && mode !== "view" && (
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            mb: 4,
            pt: 2
          }}>
            <ToggleButtonGroup
              value={currentMode}
              exclusive
              onChange={(_, newMode) => newMode && handleModeChange(newMode)}
              aria-label="mode selection"
              sx={{
                backgroundColor: "grey.100",
                borderRadius: 2,
                p: 0.5,
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: 1.5,
                  px: 3,
                  py: 1.5,
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  color: "grey.700",
                  transition: "all 0.2s ease-in-out",
                  "&.Mui-selected": {
                    backgroundColor: "white",
                    color: "primary.main",
                    fontWeight: 600,
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                    "&:hover": {
                      backgroundColor: "white",
                    }
                  },
                  "&:hover": {
                    backgroundColor: "grey.50",
                  }
                }
              }}
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
          <Box sx={{ mt: 4 }}>
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              mb: 4,
              p: 3,
              backgroundColor: "primary.50",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "primary.100"
            }}>
              <Typography variant="h6" sx={{ mr: 3, fontWeight: 600, color: "primary.dark" }}>
                学習トピック:
              </Typography>
              <Chip 
                label={topic} 
                color="primary" 
                variant="filled"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  px: 1,
                  borderRadius: 1.5
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                mb: 3,
                p: 2,
                backgroundColor: "grey.50",
                borderRadius: 2
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "grey.800" }}>
                  学習内容
                </Typography>
                <Button
                  variant={contentVisible ? "contained" : "outlined"}
                  size="medium"
                  startIcon={contentVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  onClick={() => setContentVisible(!contentVisible)}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 500,
                    minWidth: "140px"
                  }}
                >
                  {contentVisible ? "内容を隠す" : "内容を表示"}
                </Button>
              </Box>

              {contentVisible && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    minHeight: "300px",
                    backgroundColor: "white",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "grey.200",
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)"
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.8,
                      fontSize: "1rem",
                      color: "grey.800"
                    }}
                  >
                    {content}
                  </Typography>
                </Paper>
              )}
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: "grey.800" }}>
                復習期限を設定
              </Typography>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500 }}>復習期限を選択してください</InputLabel>
                <Select
                  value={reviewInterval}
                  label="復習期限を選択してください"
                  onChange={(e) => setReviewInterval(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "grey.300"
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main"
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderWidth: 2
                    }
                  }}
                >
                  {reviewOptions.map((option) => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                      sx={{
                        py: 1.5,
                        fontWeight: 500,
                        "&:hover": {
                          backgroundColor: "primary.50"
                        }
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ 
              display: "flex", 
              justifyContent: "center", 
              mt: 6,
              p: 4,
              backgroundColor: "success.50",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "success.200"
            }}>
              <Button
                variant="contained"
                size="large"
                disabled={loading || !reviewInterval || studyComplete}
                onClick={handleStudyComplete}
                sx={{
                  px: { xs: 4, sm: 8 },
                  py: 2,
                  fontSize: "1.125rem",
                  borderRadius: 2,
                  minWidth: { xs: "240px", sm: "300px" },
                  fontWeight: 600,
                  backgroundColor: studyComplete ? "success.main" : "primary.main",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: studyComplete ? "none" : "translateY(-2px)",
                    boxShadow: studyComplete ? "0 4px 6px -1px rgb(0 0 0 / 0.1)" : "0 10px 15px -3px rgb(0 0 0 / 0.15)"
                  },
                  "&:disabled": {
                    backgroundColor: studyComplete ? "success.main" : "grey.300"
                  }
                }}
              >
                {loading ? "設定中..." : studyComplete ? "✓ 完了しました" : "学習完了"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "grey.800" }}>
              基本情報
            </Typography>
            <TextField
              fullWidth
              label="トピック"
              variant="outlined"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              margin="normal"
              required
              sx={{ 
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "white",
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main"
                    }
                  },
                  "&.Mui-focused": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: 2,
                      borderColor: "primary.main"
                    }
                  }
                },
                "& .MuiInputLabel-root": {
                  fontWeight: 500
                }
              }}
              slotProps={{ 
                htmlInput: { maxLength: 100 },
                formHelperText: {
                  sx: {
                    fontSize: "0.75rem",
                    color: topic.length > 90 ? "warning.main" : "grey.600",
                    fontWeight: 500
                  }
                }
              }}
              helperText={`${topic.length}/100文字`}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: "grey.800" }}>
              学習内容詳細
            </Typography>
            <TextField
              fullWidth
              label="学習内容"
              placeholder="学習した内容を詳しく記録してください..."
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              margin="normal"
              required
              multiline
              minRows={10}
              maxRows={20}
              sx={{ 
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "white",
                  "&:hover": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main"
                    }
                  },
                  "&.Mui-focused": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderWidth: 2,
                      borderColor: "primary.main"
                    }
                  }
                },
                "& .MuiInputLabel-root": {
                  fontWeight: 500
                },
                "& .MuiInputBase-input": {
                  lineHeight: 1.7,
                  fontSize: "1rem"
                }
              }}
              slotProps={{ 
                htmlInput: { maxLength: 3000 },
                formHelperText: {
                  sx: {
                    fontSize: "0.75rem",
                    color: content.length > 2700 ? "warning.main" : "grey.600",
                    fontWeight: 500
                  }
                }
              }}
              helperText={`${content.length}/3000文字`}
            />
          </Box>

          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              display: "flex", 
              alignItems: "center",
              fontWeight: 600, 
              color: "grey.800"
            }}>
              <LinkIcon sx={{ mr: 1.5, color: "primary.main" }} />
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
                  helperText="この学習内容と関連のある過去の学習を選択してください（複数選択可能）"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "white",
                      "&:hover": {
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main"
                        }
                      },
                      "&.Mui-focused": {
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderWidth: 2,
                          borderColor: "primary.main"
                        }
                      }
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.75rem",
                      color: "grey.600",
                      fontWeight: 500
                    }
                  }}
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
                      sx={{
                        borderRadius: 1.5,
                        fontWeight: 500,
                        borderColor: "primary.main",
                        color: "primary.main",
                        backgroundColor: "primary.50"
                      }}
                      {...tagProps}
                    />
                  );
                })
              }
              sx={{
                "& .MuiAutocomplete-popupIndicator": {
                  color: "grey.600"
                },
                "& .MuiAutocomplete-clearIndicator": {
                  color: "grey.600"
                }
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 3,
              mt: 6,
              p: 4,
              backgroundColor: "grey.50",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.200"
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                px: { xs: 4, sm: 8 },
                py: 2,
                fontSize: "1.125rem",
                borderRadius: 2,
                minWidth: { xs: "240px", sm: "300px" },
                fontWeight: 600,
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.15)"
                },
                "&:disabled": {
                  backgroundColor: "grey.400",
                  transform: "none"
                }
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
                  px: { xs: 3, sm: 4 },
                  py: 2,
                  fontSize: "1rem",
                  borderRadius: 2,
                  fontWeight: 500,
                  minWidth: "140px",
                  borderColor: "error.300",
                  color: "error.600",
                  backgroundColor: "white",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "error.50",
                    borderColor: "error.main",
                    color: "error.main",
                    transform: "translateY(-1px)"
                  },
                  "&:disabled": {
                    borderColor: "grey.300",
                    color: "grey.400"
                  }
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