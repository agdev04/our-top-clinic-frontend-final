import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state
import { Button } from '../ui/button';
import { MessageSquare, UserMinus, UserPlus } from 'lucide-react';
import { Input } from '../ui/input';
import { toast } from 'sonner';

// Define an interface for the patient data structure based on API response
interface Patient {
  clerk_user_id: string;
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  height: number;
  weight: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  preferred_contact_method: string;
  preferred_appointment_type: string;
  created_at: string;
  updated_at: string;
  status: string;
}

export default function CustomerManagement() {
  const { getToken } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
    
        if (!token) {
          throw new Error('Authentication token not available.');
        }

        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/patients/?page=${page}&limit=${limit}${appliedSearchTerm ? `&search=${encodeURIComponent(appliedSearchTerm)}` : ''}`; 

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
          throw new Error(errorData.message || `Failed to fetch patients: ${response.statusText}`);
        }

        const data = await response.json();
        
        setPatients(data.patients);
      } catch (err: any) {
        console.error('Error fetching patients:', err);
        if (err.message.includes('Unauthorized')) {
          setError('Session expired. Please log in again.');
        } else {
          setError(err.message || 'An unexpected error occurred while fetching patients.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [getToken, page, limit, appliedSearchTerm]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mt-10">
      <Card className={`${selectedPatient ? 'w-2/3' : 'w-full'}`}>
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
          <CardDescription>View and manage patient accounts.</CardDescription>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search patients..."
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
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Show skeleton loaders while loading
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : patients.length > 0 ? (
                patients.map((patient) => (
                  <TableRow 
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="font-medium">{`${patient.first_name} ${patient.last_name}`}</TableCell>
                    <TableCell>{patient.phone_number || 'N/A'}</TableCell>
                    <TableCell>{patient.gender || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={patient.status?.toLowerCase() === 'active' ? 'default' : 'destructive'}>
                        {patient.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>{`${patient.city}, ${patient.state}` || 'N/A'}</TableCell> 
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                    No patients found.
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
              disabled={patients.length < limit}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
      </Card>
      
      
      {selectedPatient && (
        <Card className="w-1/3">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Patient Details</CardTitle>
                <CardDescription>Detailed information about selected patient</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => console.log('Send message to', selectedPatient.id)}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button 
                  className='cursor-pointer'
                  variant={selectedPatient?.status === 'active' ? "destructive" : "default"}
                  onClick={async () => {
                    if (!selectedPatient) return;
                    
                    try {
                      const token = await getToken();
                      if (!token) throw new Error('Authentication token not available');
                      
                      const newStatus = selectedPatient.status === 'active' ? 'inactive' : 'active';
                      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/patients/${selectedPatient.id}/status`;
                      const response = await fetch(apiUrl, {
                        method: 'PATCH',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: newStatus })
                      });

                      if (!response.ok) {
                        throw new Error('Failed to update patient status');
                      }

                      // Update local state
                      setPatients(patients.map(p => 
                        p.id === selectedPatient.id ? { ...p, status: newStatus } : p
                      ));
                      setSelectedPatient({ ...selectedPatient, status: newStatus });
                      
                      toast(`Patient status updated to ${newStatus}`);
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Failed to update patient status');
                    }
                  }}
                 >
                  {selectedPatient?.status === 'active' ? (
                    <UserMinus className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">{`${selectedPatient.first_name} ${selectedPatient.last_name}`}</h3>
              <p className="text-sm text-gray-500">Patient ID: {selectedPatient.id}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p>{selectedPatient.phone_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p>{selectedPatient.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p>{selectedPatient.date_of_birth || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={selectedPatient.status?.toLowerCase() === 'active' ? 'default' : 'destructive'}>
                  {selectedPatient.status || 'Unknown'}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p>{selectedPatient.address || 'N/A'}</p>
              <p>{`${selectedPatient.city}, ${selectedPatient.state} ${selectedPatient.zip_code}` || 'N/A'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Height</p>
                <p>{selectedPatient.height ? `${selectedPatient.height} cm` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Weight</p>
                <p>{selectedPatient.weight ? `${selectedPatient.weight} kg` : 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Preferred Contact Method</p>
              <p>{selectedPatient.preferred_contact_method || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Preferred Appointment Type</p>
              <p>{selectedPatient.preferred_appointment_type || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}