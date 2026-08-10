import { Routes, Route, Navigate } from "react-router-dom"; 
import { useEffect } from "react"; 
import { useAuthStore } from "./store/useAuthStore"; 
import LoginPage from "./pages/LoginPage"; 
import SignupPage from "./pages/SignupPage"; 
import DashboardPage from "./pages/DashboardPage"; 
import ProtectedRoute from "./components/ProtectedRoute"; 
import MeetingRoomPage from "./pages/MeetingRoomPage"; 
import UpcomingPage from "./pages/UpcomingPage"; 
import HistoryPage from "./pages/HistoryPage";
import { Toaster } from "react-hot-toast"; 

function App() { 
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore(); 

  useEffect(() => { 
    checkAuth(); 
  }, [checkAuth]); 

  if (isCheckingAuth) { 
    return ( 
      <div className="flex items-center justify-center h-screen text-white bg-slate-950"> 
        <p className="font-medium tracking-wide animate-pulse">Loading...</p> 
      </div> 
    ); 
  } 

  return ( 
    <> 
      <Toaster position="top-center" reverseOrder={false} /> 
      
      <Routes> 
        {/* Public Auth Routes */}
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} /> 
        <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} /> 
        
        {/* Protected Dashboard Route */}
        <Route path="/" element={ 
          <ProtectedRoute> 
            <DashboardPage /> 
          </ProtectedRoute> 
        } /> 
        
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        
        <Route path="/upcoming" element={
          <ProtectedRoute>
            <UpcomingPage />
          </ProtectedRoute>
        } />

      

        {/* Protected Live Meeting Route */}
        <Route path="/meeting/:meetingCode" element={ 
          <ProtectedRoute> 
            <MeetingRoomPage /> 
          </ProtectedRoute> 
        } /> 
      </Routes> 
    </> 
  ); 
} 

export default App;
