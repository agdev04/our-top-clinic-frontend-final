import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Input } from '@/components/ui/input';
import { uploadImage } from './lib/uploadimage';

interface ProviderFormProps {
  onSuccess: () => void;
}

const ProviderForm: React.FC<ProviderFormProps> = ({ onSuccess }) => {
  const { getToken, userId } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    practice_address: '',
    city: '',
    state: '',
    zip_code: '',
    license_number: '',
    npi: '',
    specialty: '',
    years_in_practice: 0,
    board_certified: false,
    accepting_new_patients: true,
  });
  const [licenseDocuments, setLicenseDocuments] = useState<File[]>([]);
  const [digitalSignature, setDigitalSignature] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files) return;

    if (name === 'license_documents') {
      setLicenseDocuments(Array.from(files));
    } else if (name === 'digital_signature') {
      setDigitalSignature(files[0] || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token || !userId) {
        throw new Error('Authentication token or user ID not found.');
      }

      // Upload license documents
      const licenseDocumentUrls = await Promise.all(
        licenseDocuments.map(file => uploadImage(file, 'license_documents'))
      );

      // Upload digital signature
      let digitalSignatureUrl = '';
      if (digitalSignature) {
        digitalSignatureUrl = await uploadImage(digitalSignature, 'digital_signatures');
      }

      const payload = {
        ...formData,
        clerk_user_id: userId,
        license_documents: licenseDocumentUrls,
        digital_signature: digitalSignatureUrl, // Assuming API expects URL, adjust if base64 needed
      };

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/providers/`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create provider profile.');
      }

      onSuccess(); // Callback on successful submission
      // navigate('/provider/dashboard');
    } catch (err: any) {
      console.error('Error submitting provider form:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <form onSubmit={handleSubmit} className="space-y-6 p-8">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
            <Input type="text" name="first_name" id="first_name" required value={formData.first_name} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
            <Input type="text" name="last_name" id="last_name" required value={formData.last_name} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <Input type="tel" name="phone_number" id="phone_number" required value={formData.phone_number} onChange={handleChange} placeholder="+1987654321" />
        </div>

        {/* Practice Address */}
        <div>
          <label htmlFor="practice_address" className="block text-sm font-medium text-gray-700">Practice Address</label>
          <Input type="text" name="practice_address" id="practice_address" required value={formData.practice_address} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
            <Input type="text" name="city" id="city" required value={formData.city} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
            <Input type="text" name="state" id="state" required value={formData.state} onChange={handleChange} maxLength={2} placeholder="CA" />
          </div>
          <div>
            <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">Zip Code</label>
            <Input type="text" name="zip_code" id="zip_code" required value={formData.zip_code} onChange={handleChange} />
          </div>
        </div>

        {/* Professional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="license_number" className="block text-sm font-medium text-gray-700">License Number</label>
            <Input type="text" name="license_number" id="license_number" required value={formData.license_number} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="npi" className="block text-sm font-medium text-gray-700">NPI Number</label>
            <Input type="text" name="npi" id="npi" required value={formData.npi} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Specialty</label>
            <Input type="text" name="specialty" id="specialty" required value={formData.specialty} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="years_in_practice" className="block text-sm font-medium text-gray-700">Years in Practice</label>
            <Input type="number" name="years_in_practice" id="years_in_practice" required value={formData.years_in_practice} onChange={handleChange} min="0" />
          </div>
        </div>

        {/* Boolean Flags */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input id="board_certified" name="board_certified" type="checkbox" checked={formData.board_certified} onChange={handleChange} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded" />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="board_certified" className="font-medium text-gray-700">Board Certified</label>
          </div>
        </div>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input id="accepting_new_patients" name="accepting_new_patients" type="checkbox" checked={formData.accepting_new_patients} onChange={handleChange} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded" />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="accepting_new_patients" className="font-medium text-gray-700">Accepting New Patients</label>
          </div>
        </div>

        {/* File Uploads */} 
        <div>
          <label htmlFor="license_documents" className="block text-sm font-medium text-gray-700">License Documents</label>
          <input type="file" name="license_documents" id="license_documents" multiple onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
          {licenseDocuments.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
              {licenseDocuments.map((file, index) => <li key={index}>{file.name}</li>)}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="digital_signature" className="block text-sm font-medium text-gray-700">Digital Signature</label>
          <input type="file" name="digital_signature" id="digital_signature" accept="image/*,.pdf" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
           {digitalSignature && (
            <p className="mt-2 text-sm text-gray-600">Selected: {digitalSignature.name}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">Error: {error}</p>}

        {/* Submit Button */} 
        <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#14B8A6] hover:bg-[#0F9D8B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#14B8A6] transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
      </form>
    </div>
  );
};

export default ProviderForm;