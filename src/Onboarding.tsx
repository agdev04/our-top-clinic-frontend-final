import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import PatientForm from './patientform';
import ProviderForm from './providerform';

export default function Onboarding() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'provider' | null>(null);
  const [submittedRole, setSubmittedRole] = useState(false);

  const handleRoleSelect = async (role: 'patient' | 'provider') => {
    setSelectedRole(role);
    const token = await getToken();
    if (!token) return;
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/onboarding/`;
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    setSubmittedRole(true);
  };

  const handlePatientFormSuccess = () => {
    navigate('/patient-dashboard', { replace: true });
  };
  const handleProviderFormSuccess = () => {
    navigate('/provider-dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#CBFBF1] px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl p-10 flex flex-col items-center border-t-8 border-[#14B8A6]">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 tracking-tight">Welcome to OurTopClinic</h1>
        <p className="text-md text-gray-500 mb-8">{selectedRole === 'patient' ? "Please fill in your information to complete onboarding." : selectedRole === 'provider' ? "Please fill in your provider details to complete onboarding." : "Let's get to know you!\nPlease select your role to continue onboarding."}</p>
        {selectedRole === 'patient' && submittedRole ? (
          <div className="w-full relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setSelectedRole(null);
                setSubmittedRole(false);
              }}
              className="absolute top-0 right-0 m-2 p-2 rounded-full text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <PatientForm onSuccess={handlePatientFormSuccess} />
          </div>
        ) : selectedRole === 'provider' && submittedRole ? (
          <div className="w-full relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setSelectedRole(null);
                setSubmittedRole(false);
              }}
              className="absolute top-0 right-0 m-2 p-2 rounded-full text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ProviderForm onSuccess={handleProviderFormSuccess} />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
            <div className="flex-1 bg-[#CBFBF1] rounded-2xl p-6 shadow-lg hover:shadow-xl transition relative group">
              <div className="flex flex-col items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#14B8A6] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c2.485 0 4.5-1.567 4.5-3.5S14.485 4 12 4s-4.5 1.567-4.5 3.5S9.515 11 12 11zm0 2c-3.032 0-9 1.517-9 4.5V20h18v-2.5c0-2.983-5.968-4.5-9-4.5z" /></svg>
                <span className="text-lg font-semibold text-gray-700">Patient</span>
              </div>
              <Button onClick={() => handleRoleSelect('patient')} className="w-full bg-[#14B8A6] hover:bg-[#0F9D8B] text-white font-bold py-2 rounded-md transition-colors">
                I'm a patient
              </Button>
            </div>
            <div className="flex-1 bg-[#EEE] rounded-2xl p-6 shadow-lg hover:shadow-xl transition relative group">
              <div className="flex flex-col items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#14B8A6] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a1.999 1.999 0 00-2.828 0l-4.243 4.243M15 11V7a3 3 0 10-6 0v4M12 17v.01" /></svg>
                <span className="text-lg font-semibold text-gray-700">Provider</span>
              </div>
              <Button onClick={() => handleRoleSelect('provider')} className="w-full bg-[#14B8A6] hover:bg-[#0F9D8B] text-white font-bold py-2 rounded-md transition-colors">
                I'm a provider
              </Button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-8 text-sm text-gray-400">OurTopClinic - Modern Healthcare, Personal Touch.</p>
    </div>
  );
}