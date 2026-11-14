import { createAsyncThunk } from "@reduxjs/toolkit";

import authService from "../../service/auth.service";

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || "Something went wrong";

export const sendOTP = createAsyncThunk(
  "auth/sendOTP",

  async (email, { rejectWithValue }) => {
    try {
      return await authService.sendOTP(email);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const verifyOTP = createAsyncThunk(
  "auth/verifyOTP",

  async (data, { rejectWithValue }) => {
    try {
      return await authService.verifyOTP(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",

  async (data, { rejectWithValue }) => {
    try {
      return await authService.updateProfile(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateAvatar = createAsyncThunk(
  "auth/updateAvatar",
  async (file, { rejectWithValue }) => {
    try {
      return await authService.updateAvatar(file);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);
