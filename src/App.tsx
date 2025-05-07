"use client";

import React from "react";
import { Routes, Route } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { MainPage } from "./pages/MainPage/MainPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { GamePage } from "./pages/GamePage/GamePage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { PrivateRoute } from "./widgets/auth/PrivateRoute";

const App: React.FC = () => {
  const { isLoading } = useConvexAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route path="/game" element={
        <PrivateRoute>
          <GamePage />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      } />
    </Routes>
  );
};

export default App;