import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Provider {
  clerk_user_id: string;
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  specialty: string;
  license_number: string;
  years_in_practice: number;
  created_at: string;
  updated_at: string;
  status: string;
  npi: string;
  practice_address: string;
  city: string;
  state: string;
  zip_code: string;
  board_certified: boolean;
  accepting_new_patients: boolean;
  license_documents: string[];
  digital_signature: string;
}

export default function ProvidersManagement() {
  const { getToken } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusToggle = async (provider: Provider) => {
    setIsUpdatingStatus(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token not available.');

      const newStatus = provider.status?.toLowerCase() === 'active' ? 'inactive' : 'active';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/providers/${provider.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update provider status');
      }

      // Refresh provider list
      fetchProviders();
      // Update selected provider if it's the one being toggled
      if (selectedProvider?.id === provider.id) {
        setSelectedProvider({ ...selectedProvider, status: newStatus });
      }
    } catch (err: any) {
      console.error('Error updating provider status:', err);
      setError(err.message || 'An unexpected error occurred while updating provider status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const fetchProviders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
  
      if (!token) {
        throw new Error('Authentication token not available.');
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/providers/?page=${page}&limit=${limit}${appliedSearchTerm ? `&search=${encodeURIComponent(appliedSearchTerm)}` : ''}`; 

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // console.log("Unauthorized: " + await response.text());
          throw new Error('Unauthorized - Please check your authentication token.');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch providers: ${response.statusText}`);
      }

      const data = await response.json();
  
      setProviders(data.providers);
    } catch (err: any) {
      console.error('Error fetching providers:', err);
      if (err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.message || 'An unexpected error occurred while fetching providers.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [getToken, page, limit, appliedSearchTerm]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mt-10">
      <Card className={`${selectedProvider ? 'w-2/3' : 'w-full'}`}>
        <CardHeader>
          <CardTitle>Provider Management</CardTitle>
          <CardDescription>View and manage healthcare provider accounts.</CardDescription>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={() => {
              setAppliedSearchTerm(searchTerm);
              setPage(1);
            }}>Search</Button>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-md p-2 text-sm"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-600 bg-red-100 border border-red-400 p-3 rounded mb-4">
            <p>Error: {error}</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>NPI</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>License Docs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : providers?.length > 0 ? (
                providers?.map((provider) => (
                  <TableRow 
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">{`${provider.first_name} ${provider.last_name}`}</TableCell>
                    <TableCell>{provider.specialty || 'N/A'}</TableCell>
                    <TableCell>{provider.phone_number || provider.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={provider.status?.toLowerCase() === 'active' ? 'default' : 'destructive'}>
                        {provider.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>{provider.years_in_practice ? `${provider.years_in_practice} years` : 'N/A'}</TableCell>
                    <TableCell>{provider.npi || 'N/A'}</TableCell>
                    <TableCell>{provider.city ? `${provider.city}, ${provider.state}` : 'N/A'}</TableCell>
                    <TableCell>
                      {provider.license_documents?.length > 0 ? (
                        <a href={provider.license_documents[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View License
                        </a>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                    No providers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={providers?.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
      </Card>
      
      {selectedProvider && (
        <Card className="w-1/3 bg-white shadow-lg rounded-lg overflow-hidden pt-0">
          <CardHeader className="bg-[#14B8A6] text-white p-3">
            <CardTitle className="text-xl font-bold">Provider Details</CardTitle>
            <CardDescription className="text-[#CBFBF1]">Detailed information about the selected provider</CardDescription>
          </CardHeader>
          <CardContent className="py-2 px-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#14B8A6] mb-3 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{selectedProvider.first_name} {selectedProvider.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialty</p>
                  <p className="font-medium">{selectedProvider.specialty || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{selectedProvider.years_in_practice ? `${selectedProvider.years_in_practice} years` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={selectedProvider.status?.toLowerCase() === 'active' ? 'default' : 'destructive'} className="w-fit">
                    {selectedProvider.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#14B8A6] mb-3 border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedProvider.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedProvider.email || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{selectedProvider.practice_address || 'N/A'}</p>
                  <p className="font-medium">{selectedProvider.city ? `${selectedProvider.city}, ${selectedProvider.state} ${selectedProvider.zip_code}` : 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-[#14B8A6] mb-3 border-b pb-2">Professional Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">NPI Number</p>
                  <p className="font-medium">{selectedProvider.npi || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium">{selectedProvider.license_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Board Certified</p>
                  <p className="font-medium">{selectedProvider.board_certified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">New Patients</p>
                  <p className="font-medium">{selectedProvider.accepting_new_patients ? 'Yes' : 'No'}</p>
                </div>
                <div className="col-span-2">
                  <Button 
                    variant={selectedProvider.status?.toLowerCase() === 'active' ? 'destructive' : 'default'}
                    onClick={() => handleStatusToggle(selectedProvider)}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? 'Updating...' : selectedProvider.status?.toLowerCase() === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
                {selectedProvider.license_documents?.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">License Document</p>
                    <a href={selectedProvider.license_documents[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View License
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}