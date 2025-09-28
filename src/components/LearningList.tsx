import React, { useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Fab,
  CircularProgress,
  Chip,
  IconButton,
  TextField,
  Collapse,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchLearnings } from "../store/slices/learningSlice";
import { setFilterOpen, setTopicFilter, clearTopicFilter } from "../store/slices/uiSlice";

const LearningList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { learnings, loading } = useAppSelector((state) => state.learning);
  const { filterOpen, topicFilter } = useAppSelector((state) => state.ui);

  useEffect(() => {
    dispatch(fetchLearnings());
  }, [dispatch]);

  const handleCardClick = (id: string) => {
    navigate(`/detail/${id}`);
  };

  const isOverdue = (reviewDate?: Date): boolean => {
    if (!reviewDate) return false;
    return new Date() > reviewDate;
  };

  const getReviewStatus = (reviewDate?: Date): { text: string; color: "success" | "warning" | "error" | "default" } => {
    if (!reviewDate) return { text: "復習期限なし", color: "default" };
    
    const now = new Date();
    const diffTime = reviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `復習期限切れ (${Math.abs(diffDays)}日過ぎ)`, color: "error" };
    } else if (diffDays === 0) {
      return { text: "今日が復習日", color: "warning" };
    } else if (diffDays <= 3) {
      return { text: `復習まで${diffDays}日`, color: "warning" };
    } else {
      return { text: `復習まで${diffDays}日`, color: "success" };
    }
  };

  const handleAddNew = () => {
    navigate("/add");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const filteredLearnings = learnings.filter((learning) => {
    if (!topicFilter) return true;
    return learning.topic.toLowerCase().includes(topicFilter.toLowerCase());
  });

  const handleFilterToggle = () => {
    dispatch(setFilterOpen(!filterOpen));
  };

  const handleClearFilter = () => {
    dispatch(clearTopicFilter());
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: "calc(100vh - 64px)", 
        width: "100%",
        px: { xs: 2, sm: 3, md: 4 },
        py: 3,
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <Box sx={{ mb: 6 }}>
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          mb: 3,
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: 2
        }}>
          <Box sx={{ 
            flex: 1,
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-start" },
            order: { xs: 2, sm: 1 }
          }}>
            {learnings.some(learning => isOverdue(learning.reviewDate)) && (
              <Chip
                label={`復習期限切れ: ${learnings.filter(learning => isOverdue(learning.reviewDate)).length}件`}
                color="error"
                variant="filled"
                icon={<ClearIcon sx={{ fontSize: "1rem" }} />}
                sx={{ 
                  fontSize: "0.875rem", 
                  fontWeight: 600,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  boxShadow: 2
                }}
              />
            )}
          </Box>
          <Box sx={{ order: { xs: 1, sm: 2 } }}>
            <Button
              variant={filterOpen ? "contained" : "outlined"}
              onClick={handleFilterToggle}
              startIcon={<FilterListIcon />}
              size="medium"
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 500,
                minWidth: "120px"
              }}
            >
              フィルター
            </Button>
          </Box>
        </Box>

        <Collapse in={filterOpen}>
          <Box sx={{ 
            mb: 4, 
            p: 3,
            backgroundColor: "grey.50",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200"
          }}>
            <TextField
              fullWidth
              label="トピック名で検索"
              placeholder="検索したいトピックを入力..."
              value={topicFilter}
              onChange={(e) => dispatch(setTopicFilter(e.target.value))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "grey.500" }} />
                  </InputAdornment>
                ),
                endAdornment: topicFilter && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClearFilter}
                      size="small"
                      edge="end"
                      sx={{
                        color: "grey.600",
                        "&:hover": {
                          backgroundColor: "grey.100"
                        }
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="medium"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: "white"
                  }
                }
              }}
            />
          </Box>
        </Collapse>
      </Box>

      {filteredLearnings.length === 0 && learnings.length > 0 ? (
        <Box sx={{ 
          textAlign: "center", 
          mt: 12,
          py: 8,
          px: 4,
          backgroundColor: "grey.50",
          borderRadius: 3,
          border: "1px dashed",
          borderColor: "grey.300"
        }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: "grey.700" }}>
            検索結果が見つかりません
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: "auto" }}>
            「{topicFilter}」に一致する学習内容が見つかりませんでした。
            別のキーワードで検索するか、フィルターをクリアしてください。
          </Typography>
          <Button
            variant="contained"
            onClick={handleClearFilter}
            sx={{ 
              px: 4, 
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            フィルターをクリア
          </Button>
        </Box>
      ) : learnings.length === 0 ? (
        <Box sx={{ 
          textAlign: "center", 
          mt: 12,
          py: 12,
          px: 4,
          backgroundColor: "gradient",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 3,
          color: "white"
        }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
            学習を始めましょう！
          </Typography>
          <Typography variant="body1" sx={{ mb: 6, opacity: 0.9, maxWidth: 500, mx: "auto" }}>
            まだ学習内容が登録されていません。最初の学習内容を登録して、
            効率的な学習管理を始めましょう。
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleAddNew}
            startIcon={<AddIcon />}
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.125rem",
              borderRadius: 2,
              backgroundColor: "white",
              color: "primary.main",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "grey.100",
                transform: "translateY(-2px)"
              }
            }}
          >
            最初の学習内容を登録
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredLearnings
              .sort((a, b) => {
                const aOverdue = isOverdue(a.reviewDate);
                const bOverdue = isOverdue(b.reviewDate);
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                return 0;
              })
              .map((learning) => {
                const reviewStatus = getReviewStatus(learning.reviewDate);
                const overdue = isOverdue(learning.reviewDate);
                
                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={learning.id}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        border: overdue ? "2px solid" : "1px solid",
                        borderColor: overdue ? "error.main" : "grey.200",
                        backgroundColor: overdue ? "error.50" : "white",
                        "&:hover": {
                          transform: "translateY(-8px) scale(1.02)",
                          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                          borderColor: overdue ? "error.main" : "primary.main",
                          "& .card-actions": {
                            opacity: 1,
                            transform: "translateY(0)"
                          }
                        },
                        "&:before": overdue ? {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: "linear-gradient(90deg, #ef4444, #f87171)",
                          zIndex: 1
                        } : {}
                      }}
                      onClick={() => handleCardClick(learning.id)}
                    >
                      <CardContent sx={{ 
                        flexGrow: 1, 
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2
                      }}>
                        <Box sx={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "flex-start", 
                          gap: 2
                        }}>
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              fontWeight: 700,
                              color: overdue ? "error.dark" : "grey.900",
                              fontSize: "1.125rem",
                              lineHeight: 1.4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              flex: 1
                            }}
                          >
                            {learning.topic}
                          </Typography>
                          <Chip
                            label={reviewStatus.text}
                            color={reviewStatus.color}
                            size="small"
                            variant={overdue ? "filled" : "outlined"}
                            sx={{
                              flexShrink: 0,
                              fontWeight: 600,
                              borderRadius: 1.5,
                              "& .MuiChip-label": {
                                px: 1
                              }
                            }}
                          />
                        </Box>
                        
                        <Typography
                          variant="body2"
                          sx={{
                            color: "grey.700",
                            lineHeight: 1.7,
                            fontSize: "0.875rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            flex: 1
                          }}
                        >
                          {getContentPreview(learning.content, 120)}
                        </Typography>
                        
                        <Box sx={{ 
                          pt: 1,
                          borderTop: "1px solid",
                          borderColor: "grey.100",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5
                        }}>
                          <Typography
                            variant="caption"
                            sx={{ 
                              color: "grey.600",
                              fontWeight: 500,
                              fontSize: "0.75rem"
                            }}
                          >
                            登録: {formatDate(learning.createdAt)}
                          </Typography>
                          {learning.reviewDate && (
                            <Typography
                              variant="caption"
                              sx={{ 
                                color: overdue ? "error.main" : "grey.600",
                                fontWeight: 500,
                                fontSize: "0.75rem"
                              }}
                            >
                              復習: {formatDate(learning.reviewDate)}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box 
                          className="card-actions"
                          sx={{
                            opacity: 0,
                            transform: "translateY(8px)",
                            transition: "all 0.2s ease-in-out",
                            pt: 1
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "primary.main",
                              fontWeight: 600,
                              fontSize: "0.75rem"
                            }}
                          >
                            クリックして詳細を表示 →
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>

          <Fab
            color="primary"
            aria-label="add"
            onClick={handleAddNew}
            sx={{
              position: "fixed",
              bottom: { xs: 24, sm: 32 },
              right: { xs: 24, sm: 32 },
              width: 64,
              height: 64,
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "scale(1.1) translateY(-4px)",
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
              },
              "&:active": {
                transform: "scale(1.05)"
              }
            }}
          >
            <AddIcon sx={{ fontSize: "1.75rem" }} />
          </Fab>
        </>
      )}
    </Box>
  );
};

export default LearningList;