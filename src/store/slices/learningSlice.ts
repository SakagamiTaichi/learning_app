import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  collection,
  getDocs,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../../firebase';

export interface LearningData {
  id: string;
  topic: string;
  content: string;
  createdAt: Date;
  reviewDate?: Date;
  relatedLearnings?: string[];
}

interface LearningState {
  learnings: LearningData[];
  currentLearning: LearningData | null;
  loading: boolean;
  error: string | null;
  fetchLoading: boolean;
}

const initialState: LearningState = {
  learnings: [],
  currentLearning: null,
  loading: false,
  error: null,
  fetchLoading: false,
};

export const fetchLearnings = createAsyncThunk(
  'learning/fetchLearnings',
  async (_, { rejectWithValue }) => {
    try {
      const q = query(collection(db, 'learnings'), orderBy('createdAt', 'desc'));
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

      return learningsData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'データの取得に失敗しました。';
      return rejectWithValue(message);
    }
  }
);

export const fetchLearningById = createAsyncThunk(
  'learning/fetchLearningById',
  async (id: string, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'learnings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          reviewDate: data.reviewDate ? data.reviewDate.toDate() : undefined,
        } as LearningData;
      } else {
        return rejectWithValue('指定された学習内容が見つかりませんでした。');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'データの取得に失敗しました。';
      return rejectWithValue(message);
    }
  }
);

export const addLearning = createAsyncThunk(
  'learning/addLearning',
  async (
    learningData: Omit<LearningData, 'id'>,
    { rejectWithValue }
  ) => {
    try {
      const docRef = await addDoc(collection(db, 'learnings'), learningData);
      return {
        id: docRef.id,
        ...learningData,
      } as LearningData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'データの保存に失敗しました。';
      return rejectWithValue(message);
    }
  }
);

export const updateLearning = createAsyncThunk(
  'learning/updateLearning',
  async (
    { id, data }: { id: string; data: Partial<Omit<LearningData, 'id' | 'createdAt'>> },
    { rejectWithValue }
  ) => {
    try {
      const docRef = doc(db, 'learnings', id);
      await updateDoc(docRef, data as DocumentData);
      return { id, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'データの更新に失敗しました。';
      return rejectWithValue(message);
    }
  }
);

export const deleteLearning = createAsyncThunk(
  'learning/deleteLearning',
  async (id: string, { rejectWithValue }) => {
    try {
      const docRef = doc(db, 'learnings', id);
      await deleteDoc(docRef);
      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'データの削除に失敗しました。';
      return rejectWithValue(message);
    }
  }
);

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentLearning: (state) => {
      state.currentLearning = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLearnings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLearnings.fulfilled, (state, action) => {
        state.loading = false;
        state.learnings = action.payload;
      })
      .addCase(fetchLearnings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchLearningById.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
      })
      .addCase(fetchLearningById.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.currentLearning = action.payload;
      })
      .addCase(fetchLearningById.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.payload as string;
      })
      .addCase(addLearning.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addLearning.fulfilled, (state, action) => {
        state.loading = false;
        state.learnings.unshift(action.payload);
      })
      .addCase(addLearning.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateLearning.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLearning.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.learnings.findIndex((l) => l.id === action.payload.id);
        if (index !== -1) {
          state.learnings[index] = { ...state.learnings[index], ...action.payload.data };
        }
        if (state.currentLearning?.id === action.payload.id) {
          state.currentLearning = { ...state.currentLearning, ...action.payload.data };
        }
      })
      .addCase(updateLearning.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteLearning.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLearning.fulfilled, (state, action) => {
        state.loading = false;
        state.learnings = state.learnings.filter((l) => l.id !== action.payload);
        if (state.currentLearning?.id === action.payload) {
          state.currentLearning = null;
        }
      })
      .addCase(deleteLearning.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentLearning } = learningSlice.actions;
export default learningSlice.reducer;