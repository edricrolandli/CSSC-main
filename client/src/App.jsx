import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Jadwal from "./pages/Jadwal";
import Pengumuman from "./pages/Pengumuman";
import Materi from "./pages/Materi";
import MateriDetail from "./pages/MateriDetail";
import MateriPertemuan from "./pages/MateriPertemuan";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import { AuthProvider, useAuth } from "./context/AuthContext";

const RequireAuth = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const hasRegistered = !!localStorage.getItem("cssc-registered-user");

  if (!user) {
    if (hasRegistered) {
      return <Navigate to="/Login" replace state={{ from: location }} />;
    }
    return <Navigate to="/Register" replace state={{ from: location }} />;
  }

  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const hideLayout = ["/Login", "/Register", "/ResetPassword"].includes(
    location.pathname
  );
  const hideFooter = location.pathname === "/Jadwal";

  return (
    <>
      {!hideLayout && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/ResetPassword" element={<ResetPassword />} />
        <Route
          path="/Jadwal"
          element={
            <RequireAuth>
              <div className="min-h-screen flex flex-col">
                <div className="flex-1">
                  <Jadwal />
                </div>
              </div>
            </RequireAuth>
          }
        />
        <Route
          path="/Materi"
          element={
            <RequireAuth>
              <Materi />
            </RequireAuth>
          }
        />
        <Route
          path="/Materi/:id"
          element={
            <RequireAuth>
              <MateriDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/Materi/:id/:pertemuan"
          element={
            <RequireAuth>
              <MateriPertemuan />
            </RequireAuth>
          }
        />

        <Route
          path="/Pengumuman"
          element={
            <RequireAuth>
              <Pengumuman />
            </RequireAuth>
          }
        />
        <Route
          path="/Profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
      </Routes>
      {!hideLayout && !hideFooter && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
};

export default App;
