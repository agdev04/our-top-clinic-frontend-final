import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import { Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Import the Button component
import { Toaster } from "@/components/ui/sonner";
import ProviderDashboard from "./components/provider/ProviderDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import PatientDashboard from "./components/patient/PatientDashboard";
import ProviderDetails from "./components/patient/ProviderDetails";
import { useNavigate } from "react-router-dom";
import Onboarding from "./Onboarding";
import CustomerManagement from "./components/admin/PatientsManagement";
import RoleProtectedRoute from "./RoleProtectedRoute";
import ProvidersManagement from "./components/admin/ProvidersManagement";
import ServicesManagement from "./components/admin/ServicesManagement";
import Messages from "./components/admin/Messages";
import CommissionRating from "./components/admin/CommissionRating";
// Patient Dashboard Components
import PatientDashboardContent from "./components/patient/PatientDashboardContent";
import ProvidersList from "./components/patient/ProvidersList";
// Provider Dashboard Components
import DashboardContent from "./components/provider/DashboardContent";
import ProviderServices from "./components/provider/ProviderServices";
import ProviderMessages from "./components/provider/ProviderMessages";
import AdminDashboardContent from "./components/admin/AdminDashboardContent";
import HomePage from "./components/HomePage";
import PatientMessages from "./components/patient/PatientMessages";
import ProviderAppointmentsList from "./components/provider/AppointmentsList";
import PatientAppointmentsList from "./components/patient/AppointmentsList";
import ProviderVideoCallPage from "./components/provider/ProviderVideoCallPage";
import PatientVideoCallPage from "./components/patient/PatientVideoCallPage";
import AdminAppointmentsList from "./components/admin/AdminAppointmentsList";

function App() {
  // const [jwtToken, setJwtToken] = useState("");
  const [userData, setUserData] = useState(null);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false); // Add state to track initial check
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserDataAndRedirect() {
      if (initialCheckComplete) return; // Don't run if check is already complete

      try {
        const token = await getToken();
        if (!token) {
          setInitialCheckComplete(true); // Mark check as complete even if no token
          return;
        }
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/me`;
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setUserData(data);
        setInitialCheckComplete(true); // Mark check as complete after fetching data

        // Redirect logic
        if (data && data.record === null && data.user.role !== "admin") {
          navigate("/onboarding", { replace: true });
        } else if (data && data.user && data.user.role) {
          const currentPath = window.location.pathname;
          const targetPath =
            data.user.role === "patient"
              ? "/patient-dashboard"
              : data.user.role === "provider"
              ? "/provider-dashboard"
              : data.user.role === "admin"
              ? "/admin-dashboard"
              : "/";

          // Only redirect if not already on a sub-path of the target dashboard or onboarding
          if (
            !currentPath.startsWith(targetPath) &&
            currentPath !== "/onboarding"
          ) {
            navigate(targetPath, { replace: true });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setInitialCheckComplete(true); // Also mark complete on error to prevent loops
      }
    }

    if (isSignedIn) {
      fetchUserDataAndRedirect();
    }
  }, [isSignedIn, getToken, navigate]);

  // async function handleGetToken() {
  //   const token = await getToken();
  //   setJwtToken(token || "");
  // }

  return (
    <>
      <main className="min-h-screen bg-[#CBFBF1] relative">
        <div className="absolute top-5 right-5">
          <SignedOut>
            <SignInButton mode="modal">
              {/* Replace button with Button component */}
              <Button className="bg-[#14B8A6] hover:bg-[#0F9D8B] text-white px-4 py-2 rounded-md transition-colors">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
        <Toaster />
        {/* <div className="w-1/2">
          <button
            className="p-3 rounded-xl bg-blue-200 cursor-pointer"
            onClick={handleGetToken}
          >
            Get JWT Token
          </button>
          <p className="w-[50vw]">JWT Token: {jwtToken}</p>
        </div> */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="patient-dashboard"
            element={
              <RoleProtectedRoute requiredRole="patient" userData={userData}>
                <PatientDashboard />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<PatientDashboardContent />} />
            <Route path="providers" element={<ProvidersList />} />
            <Route path="providers/:id" element={<ProviderDetails />} />
            <Route path="video-call/:id" element={<PatientVideoCallPage />} />

            <Route path="appointments" element={<PatientAppointmentsList />} />
            <Route path="labs" element={<div>Patient Labs Placeholder</div>} />
            <Route
              path="pharmacy"
              element={<div>Patient Pharmacy Placeholder</div>}
            />
            <Route
              path="messages"
              element={<PatientMessages />}
            />

          </Route>
          <Route
            path="provider-dashboard"
            element={
              <RoleProtectedRoute requiredRole="provider" userData={userData}>
                <ProviderDashboard />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<DashboardContent />} />
            <Route
              path="appointments"
              element={<ProviderAppointmentsList />}
            />
            
            <Route path="services" element={<ProviderServices />} />
            <Route path="messages" element={<ProviderMessages />} />
            <Route path="video-call/:id" element={<ProviderVideoCallPage />} />
            <Route
              path="earnings"
              element={<div>Provider Earnings Placeholder</div>}
            />

          </Route>
          <Route
            path="admin-dashboard"
            element={
              <RoleProtectedRoute requiredRole="admin" userData={userData}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardContent />} />
            <Route path="patients" element={<CustomerManagement />} />
            <Route path="providers" element={<ProvidersManagement />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="messages" element={<Messages />} />
            <Route path="appointments" element={<AdminAppointmentsList />} />
            <Route path="commission-rating" element={<CommissionRating />} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>
          <Route path="onboarding" element={<Onboarding />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
