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
        const learningsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as LearningData[];

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
    navigate(`/edit/${id}`);
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
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          textAlign: "center",
          mb: 4,
          fontSize: { xs: "1.75rem", sm: "2rem", md: "2.125rem" },
        }}
      >
        学習内容一覧
      </Typography>

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
            {learnings.map((learning) => (
              <Grid item xs={12} sm={6} md={4} key={learning.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 6,
                    },
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onClick={() => handleCardClick(learning.id)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      gutterBottom
                      sx={{
                        fontWeight: "bold",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {learning.topic}
                    </Typography>
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
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