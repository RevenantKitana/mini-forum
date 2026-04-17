import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { FontSizeProvider } from '@/contexts/FontSizeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PrivateRoute } from '@/routes';
import { MainLayout } from '@/components/layout/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { PostDetailPage } from '@/pages/PostDetailPage';
import { EditPostPage } from '@/pages/EditPostPage';
import { SearchPage } from '@/pages/SearchPage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { EditProfilePage } from '@/pages/EditProfilePage';
import { BlockedUsersPage } from '@/pages/BlockedUsersPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { TagsPage } from '@/pages/TagsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { Toaster } from '@/app/components/ui/sonner';
import { TooltipProvider } from '@/app/components/ui/tooltip';
import { Button } from '@/app/components/ui/button';
import { Home, AlertTriangle } from 'lucide-react';
import { RealtimeNotificationsProvider } from '@/components/common/RealtimeNotificationsProvider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeNotificationsProvider>
          <SidebarProvider>
            <FontSizeProvider>
              <TooltipProvider>
                <BrowserRouter>
                <Routes>
                  {/* Main Layout Routes */}
                  <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="posts/:id" element={<PostDetailPage />} />
              <Route path="users/:username" element={<ProfilePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="tags" element={<TagsPage />} />
              
              {/* Protected Routes */}
              <Route
                path="posts/:id/edit"
                element={
                  <PrivateRoute>
                    <EditPostPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="bookmarks"
                element={
                  <PrivateRoute>
                    <BookmarksPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="settings/profile"
                element={
                  <PrivateRoute>
                    <EditProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="settings/blocked"
                element={
                  <PrivateRoute>
                    <BlockedUsersPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <PrivateRoute>
                    <NotificationsPage />
                  </PrivateRoute>
                }
              />
              
              {/* 404 for routes inside main layout */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Auth Routes (without main layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Routes>
              <Toaster position="top-right" richColors closeButton />
            </BrowserRouter>
            </TooltipProvider>
          </FontSizeProvider>
        </SidebarProvider>
      </RealtimeNotificationsProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Simple 404 Page
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-muted-foreground mb-6">Trang bạn tìm kiếm không tồn tại</p>
      <Button asChild>
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Về trang chủ
        </Link>
      </Button>
    </div>
  );
}
