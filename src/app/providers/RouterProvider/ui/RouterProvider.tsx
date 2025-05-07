import { FC } from 'react';
import { createBrowserRouter, RouterProvider as ReactRouterProvider } from 'react-router-dom';
import { routerConfig } from '@/app/router';
import { useConvexAuth } from 'convex/react';

const router = createBrowserRouter(routerConfig);

export const RouterProvider: FC = () => {
  const { isLoading } = useConvexAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return <ReactRouterProvider router={router} />;
}; 