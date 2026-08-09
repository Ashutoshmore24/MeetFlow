import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast"; 

function App() {
 
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p> 
      </div>
    );
  }

  return (
    
    <>
    <Toaster position="top-right" reverseOrder={false} />
    
    <Routes>
      <Route 
        path="/login" 
        element={!authUser ? <LoginPage /> : <Navigate to="/" />} 
      />
      <Route 
        path="/signup" 
        element={!authUser ? <SignupPage /> : <Navigate to="/" />} 
      />
      
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      </Routes>
    </>
  );
}

export default App;
