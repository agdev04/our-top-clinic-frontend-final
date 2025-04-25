import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table as TableIcon, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Provider {
  id: number;
  first_name: string;
  last_name: string;
  specialty: string;
  status: string;
  clinic_name?: string;
  city?: string;
  state?: string;
  photo_url?: string;
}

const specialties = [
  '', 'Cardiology', 'Dermatology', 'Pediatrics', 'Oncology', 'Orthopedics', 'Neurology', 'Psychiatry', 'Family Medicine', 'Emergency Medicine', // add more as needed
];
const statuses = ['', 'active', 'inactive', 'pending'];

export default function ProvidersList() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [status, setStatus] = useState('active');
  const [limit, setLimit] = useState(5);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [layout, setLayout] = useState<'grid'|'table'>('grid');

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication required');
        const searchParams = new URLSearchParams({
          name: name ?? '',
          specialty: specialty ?? '',
          limit: limit.toString(),
          offset: offset.toString(),
          status: status ?? '',
        });
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/providers?${searchParams.toString()}`;
        const response = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || response.statusText);
        }
        const data = await response.json();
        setProviders(data.providers || []);
        setTotal(typeof data.total === 'number' ? data.total : 0);
      } catch (err:any) {
        setError(err.message || 'Could not fetch providers.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProviders();
    // eslint-disable-next-line
  }, [getToken, name, specialty, status, limit, offset]);

  const canPrev = offset > 0;
  const canNext = providers.length === limit && total > offset + limit;

  return (
    <Card className="mt-10">
      <CardHeader>
        <div className="flex flex-row justify-between items-end w-full">
          <div>
            <CardTitle>Providers Directory</CardTitle>
            <CardDescription>Browse and filter top healthcare providers.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={layout === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
              className={`px-3 flex items-center justify-center ${layout === 'grid' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-white text-teal-600 border-teal-600 hover:bg-teal-50'} transition-colors`}
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              variant={layout === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayout('table')}
              aria-label="Table view"
              className={`px-3 flex items-center justify-center ${layout === 'table' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-white text-teal-600 border-teal-600 hover:bg-blue-50'} transition-colors`}
            >
              <TableIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Input
            placeholder="Name (e.g. Smith)"
            value={name}
            onChange={e => { setName(e.target.value); setOffset(0); }}
            className="max-w-xs"
          />
          <select value={specialty} onChange={e => { setSpecialty(e.target.value); setOffset(0); }} className="border rounded-md p-2 text-sm">
            {specialties.map(spec => (<option key={spec} value={spec}>{spec ? spec : 'Any Specialty'}</option>))}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setOffset(0); }} className="border rounded-md p-2 text-sm">
            {statuses.map(stat => (<option key={stat} value={stat}>{stat ? stat[0].toUpperCase() + stat.substr(1) : 'Any Status'}</option>))}
          </select>
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setOffset(0); }} className="border rounded-md p-2 text-sm">
            {[5, 10, 25, 50].map(num => (
              <option value={num} key={num}>{num} per page</option>))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-100 text-red-800 p-2 rounded my-3">{error}</div>}
        {/* Providers Main Layout */}
        {layout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-2">
          {isLoading ? (
            Array.from({length:limit}).map((_,i) => (
              <div key={i} className="bg-white border rounded-lg shadow-sm p-4 flex flex-col items-center">
                <Skeleton className="h-16 w-16 rounded-full mb-3" />
                <Skeleton className="h-6 w-28 mb-2" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : providers.length > 0 ? (
            providers.map((prov: Provider) => (
              <div key={prov.id} className="bg-white border rounded-lg shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/patient-dashboard/providers/${prov.id}`)}>
                {prov.photo_url ? (
                  <img src={prov.photo_url} alt={`${prov.first_name} ${prov.last_name}`} className="h-16 w-16 rounded-full object-cover mb-3 border" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400 font-bold text-xl border">
                    {prov.first_name?.[0] || '?'}{prov.last_name?.[0] || ''}
                  </div>
                )}
                <div className="font-semibold text-lg text-slate-900 mb-1">
                  {prov.first_name} {prov.last_name}
                </div>
                <div className="text-sm text-gray-500 mb-1">{prov.specialty || 'N/A'}</div>
                <div className="mb-1">
                  <Badge variant={prov.status?.toLowerCase()==='active'?'default':'destructive'}>{prov.status || 'Unknown'}</Badge>
                </div>
                <div className="text-xs text-gray-400">{(prov.city && prov.state) ? `${prov.city}, ${prov.state}` : 'N/A'}</div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-6">No providers found.</div>
          )}
        </div>
        ) : (
        <div className="overflow-x-auto py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length:limit}).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : providers.length > 0 ? (
                providers.map((prov: Provider) => (
                  <TableRow key={prov.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/patient-dashboard/providers/${prov.id}`)}>
                    <TableCell className="flex items-center gap-2">
                      {prov.photo_url ? (
                        <img src={prov.photo_url} alt={`${prov.first_name} ${prov.last_name}`} className="h-8 w-8 rounded-full object-cover border" />
                      ) : (
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-md border">{prov.first_name?.[0] || '?'}{prov.last_name?.[0] || ''}</span>
                      )}
                      <span>{prov.first_name} {prov.last_name}</span>
                    </TableCell>
                    <TableCell>{prov.specialty || 'N/A'}</TableCell>
                    <TableCell><Badge variant={prov.status?.toLowerCase()==='active'?'default':'destructive'}>{prov.status || 'Unknown'}</Badge></TableCell>
                    <TableCell>{(prov.city&&prov.state) ? `${prov.city}, ${prov.state}` : 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-6">No providers found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        )}
        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-3">
          <Button variant="outline" size="sm" disabled={!canPrev} onClick={()=>setOffset(Math.max(0, offset - limit))}>Previous</Button>
          <span className="text-sm">Page {Math.floor(offset/limit)+1}{total>0?` of ${Math.ceil(total/limit)}`:''}</span>
          <Button variant="outline" size="sm" disabled={!canNext} onClick={()=>setOffset(offset+limit)}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}