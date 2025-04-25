import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '../ui/button';

type CommissionRate = {
  id: number;
  rate: number;
  provider_type: string;
  service_type: string;
  created_at: string;
  updated_at: string;
  active: boolean;
};

export default function CommissionRating() {
  const { getToken } = useAuth();
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newRate, setNewRate] = useState<number>(0);
  const [isCreatingRate, setIsCreatingRate] = useState(false);

  useEffect(() => {
    const fetchCommissionRates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error('Authentication token not available');

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/commission-rates/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch commission rates');
        }

        const data = await response.json();
        setRates(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load commission rates');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommissionRates();
  }, [getToken]);


  const handleStatusToggle = async (rate: CommissionRate) => {
    setIsUpdatingStatus(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token not available');

      const endpoint = `${import.meta.env.VITE_API_BASE_URL}/commission-rates/${rate.id}/activate`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update commission rate status');
      }

      // Update local state
      setRates(rates.map(r => 
        r.id === rate.id ? { ...r, active: true } : r
      ));
    } catch (err: any) {
      console.error('Error updating commission rate status:', err);
      setError(err.message || 'Failed to update commission rate status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const handleCreateRate = async () => {
    setIsCreatingRate(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication token not available');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/commission-rates/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rate: newRate })
      });

      if (!response.ok) {
        throw new Error('Failed to create commission rate');
      }

      const data = await response.json();
      setRates([...rates, data]);
      setNewRate(0);
    } catch (err: any) {
      console.error('Error creating commission rate:', err);
      setError(err.message || 'Failed to create commission rate');
    } finally {
      setIsCreatingRate(false);
    }
  };

  return (
    <div className="space-y-4 mt-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Commission Rating</CardTitle>
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="number"
              min="0"
              step="0.01"
              value={newRate}
              onChange={(e) => setNewRate(parseFloat(e.target.value))}
              className="border rounded px-3 py-2 w-32"
              placeholder="Rate"
            />
            <Button 
              onClick={handleCreateRate}
              disabled={isCreatingRate || !newRate}
            >
              {isCreatingRate ? 'Adding...' : 'Add Rate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 border-b border-gray-200">
              <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:text-teal-600 pb-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:text-teal-600 pb-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder for commission stats */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Active Commission Rate</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? 'Loading...' : 
                     error ? 'Error' : 
                     rates.find(rate => rate.active) ? `$${rates.find(rate => rate.active)?.rate.toFixed(2)}` : 'No active rate'}
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="details">
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-sm text-gray-500">Loading commission details...</p>
                ) : error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : rates.length > 0 ? (
                  rates.map(rate => (
                    <div key={rate.id} className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{rate.provider_type} - {rate.service_type}</p>
                        <p className="text-lg font-bold">${rate.rate.toFixed(2)}</p>
                      </div>
                      <Button 
                        variant={rate.active ? 'default' : 'outline'}
                        onClick={() => handleStatusToggle(rate)}
                        disabled={isUpdatingStatus}
                      >
                        {rate.active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No commission rates found</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}