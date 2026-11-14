import { createSlice } from "@reduxjs/toolkit";

import {
  sendOTP,
  verifyOTP,
  updateProfile,
  updateAvatar,
} from "../actions/authActions";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const initialState = {

  user: getStoredUser(),

  token: localStorage.getItem("token") || null,

  isAuthenticated: !!localStorage.getItem("token"),

  loading: false,

  error: null,

};



const authSlice = createSlice({

  name: "auth",

  initialState,


  reducers: {


    setLoading: (state, action) => {

      state.loading = action.payload;

    },


    setUser: (state, action) => {


      state.user = action.payload.user;

      state.token = action.payload.token;

      state.isAuthenticated = true;

      state.loading = false;

      state.error = null;


      localStorage.setItem(
        "user",
        JSON.stringify(action.payload.user)
      );


      localStorage.setItem(
        "token",
        action.payload.token
      );

    },



    setError: (state, action) => {

      state.error = action.payload;

      state.loading = false;

    },



    logout: (state) => {

      state.user = null;

      state.token = null;

      state.isAuthenticated = false;

      state.loading = false;

      state.error = null;


      localStorage.removeItem("user");

      localStorage.removeItem("token");

    },


  },


  extraReducers: (builder) => {


    // SEND OTP

    builder.addCase(
      sendOTP.pending,
      (state) => {

        state.loading = true;

        state.error = null;

      }
    );


    builder.addCase(
      sendOTP.fulfilled,
      (state) => {

        state.loading = false;

      }
    );


    builder.addCase(
      sendOTP.rejected,
      (state, action) => {

        state.loading = false;

        state.error = action.payload;

      }
    );



    // VERIFY OTP

    builder.addCase(
      verifyOTP.pending,
      (state) => {

        state.loading = true;

        state.error = null;

      }
    );



    builder.addCase(
      verifyOTP.fulfilled,
      (state, action) => {


        state.loading = false;


        state.user =
          action.payload.user;


        state.token =
          action.payload.token;


        state.isAuthenticated = true;



        localStorage.setItem(
          "user",
          JSON.stringify(action.payload.user)
        );


        localStorage.setItem(
          "token",
          action.payload.token
        );


      }
    );



    builder.addCase(
      verifyOTP.rejected,
      (state, action) => {

        state.loading = false;

        state.error = action.payload;

      }
    );



    // UPDATE PROFILE

    builder.addCase(
      updateProfile.pending,
      (state) => {

        state.loading = true;

      }
    );



    builder.addCase(
      updateProfile.fulfilled,
      (state, action) => {

        state.loading = false;

        state.error = null;

        if (action.payload.user) {
          state.user = action.payload.user;
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        }

      }
    );



    builder.addCase(
      updateProfile.rejected,
      (state, action) => {

        state.loading = false;

        state.error = action.payload;

      }
    );

    builder.addCase(updateAvatar.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(updateAvatar.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    });

    builder.addCase(updateAvatar.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });


  }

});


export const {
  setLoading,
  setUser,
  setError,
  logout

} = authSlice.actions;


export default authSlice.reducer;
