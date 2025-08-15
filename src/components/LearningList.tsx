import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

interface LearningData {
  id: string;
  topic: string;
  content: string;
  createdAt: Date;
  reviewDate?: Date;
  relatedLearnings?: string[];
}

const LearningList: React.FC = () => {
  const [learnings, setLearnings] = useState<LearningData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLearnings = async () => {
      try {
        const q = query(
          collection(db, "learnings"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const learningsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            reviewDate: data.reviewDate ? data.reviewDate.toDate() : undefined,
          };
        }) as LearningData[];

        setLearnings(learningsData);
      } catch (error) {
        console.error("Error fetching learnings: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLearnings();
  }, []);

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
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: "1.75rem", sm: "2rem", md: "2.125rem" },
          }}
        >
          学習内容一覧
        </Typography>
        {learnings.some(learning => isOverdue(learning.reviewDate)) && (
          <Chip
            label={`復習期限切れ: ${learnings.filter(learning => isOverdue(learning.reviewDate)).length}件`}
            color="error"
            variant="filled"
            sx={{ fontSize: "0.9rem", fontWeight: "bold" }}
          />
        )}
      </Box>

      {learnings.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            まだ学習内容が登録されていません
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleAddNew}
            startIcon={<AddIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              borderRadius: 2,
            }}
          >
            最初の学習内容を登録する
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {learnings
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
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={learning.id}>
                    <Card
                      sx={{
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 6,
                        },
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        border: overdue ? "2px solid" : "1px solid",
                        borderColor: overdue ? "error.main" : "divider",
                        backgroundColor: overdue ? "error.50" : "background.paper",
                        cursor: "pointer",
                      }}
                      onClick={() => handleCardClick(learning.id)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              fontWeight: "bold",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              mr: 1,
                            }}
                          >
                            {learning.topic}
                          </Typography>
                          <Chip
                            label={reviewStatus.text}
                            color={reviewStatus.color}
                            size="small"
                            variant={overdue ? "filled" : "outlined"}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {getContentPreview(learning.content)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: "medium" }}
                        >
                          登録日: {formatDate(learning.createdAt)}
                        </Typography>
                        {learning.reviewDate && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: "medium", display: "block" }}
                          >
                            復習予定: {formatDate(learning.reviewDate)}
                          </Typography>
                        )}
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
              bottom: 32,
              right: 32,
            }}
          >
            <AddIcon />
          </Fab>
        </>
      )}
    </Box>
  );
};

export default LearningList;