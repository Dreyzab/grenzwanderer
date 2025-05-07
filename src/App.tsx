"use client";

import React from "react";
import { Routes, Route, RouterProvider, createBrowserRouter } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { MainPage } from "./pages/MainPage/MainPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { GamePage } from "./pages/GamePage/GamePage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import { PrivateRoute } from "./widgets/auth/PrivateRoute";
import { routerConfig } from './app/router/config';
import './index.css';

const App: React.FC = () => {
  const { isLoading } = useConvexAuth();
  
  // Создаем роутер с конфигурацией
  const router = createBrowserRouter(routerConfig);

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return <RouterProvider router={router} />;
};

export default App;