import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardDescription
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react'; // Added Pencil and Trash icons
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter, 
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';

interface Service {
  id: string;
  name: string;
  category?: string;
  description: string;
  price: number;
  duration_minutes?: number;
  status?: 'active' | 'inactive';
}

// Define the form schema using Zod
const serviceSchema = z.object({
  name: z.string().min(1, { message: 'Service name is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number' }),
  duration_minutes: z.coerce.number().int().positive({ message: 'Duration must be a positive integer' }),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const ProviderServices: React.FC = () => {
  const { getToken } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false); // Renamed for clarity
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { 
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  // Use a separate form instance for editing to avoid state conflicts
  const { 
    register: registerEdit, 
    handleSubmit: handleEditSubmit, 
    reset: resetEdit, 
    setValue: setEditValue, // To pre-fill the form
    formState: { errors: editErrors }
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const fetchServices = async () => {
    // Keep setLoading(true) outside try/catch if you want initial load indicator
    // setLoading(true); 
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/services/my-services/`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data: Service[] = await response.json();
      setServices(data);
    } catch (err: any) { // Catch specific error types if possible
      setError(err.message || 'An unexpected error occurred while fetching services.');
      console.error('Error fetching services:', err);
      // Consider showing a toast for fetch errors too
      // toast.error(err.message || 'Failed to load services.');
    } finally {
      setLoading(false); // Ensure loading is set to false even on error
    }
  };

  useEffect(() => {
    setLoading(true); // Set loading true when effect runs
    fetchServices();
  }, [getToken]);

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/services/`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Attempt to parse error JSON
        throw new Error(errorData.message || `Failed to add service: ${response.statusText}`);
      }

      // Success
      toast.success('Service added successfully!');
      reset(); // Reset form fields
      setIsAddDialogOpen(false); // Close the dialog
      fetchServices(); // Refresh the services list

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while adding the service.');
      console.error('Error adding service:', err);
      toast.error(err.message || 'Failed to add service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for submitting the updated service
  const onUpdateSubmit = async (data: ServiceFormData) => {
    if (!editingService) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/services/${editingService.id}`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update service: ${response.statusText}`);
      }

      toast.success('Service updated successfully!');
      resetEdit();
      setIsEditDialogOpen(false);
      setEditingService(null);
      fetchServices(); // Refresh list

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while updating the service.');
      console.error('Error updating service:', err);
      toast.error(err.message || 'Failed to update service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication token not found.');
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/services/${serviceId}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete service: ${response.statusText}`);
      }

      toast.success('Service deleted successfully!');
      fetchServices(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while deleting the service.');
      console.error('Error deleting service:', err);
      toast.error(err.message || 'Failed to delete service.');
    }
  };

  // Handler to open the edit dialog and pre-fill form
  const handleEditClick = (service: Service) => {
    setEditingService(service);
    // Pre-fill the edit form
    setEditValue('name', service.name);
    setEditValue('category', service.category || ''); // Handle potential undefined category
    setEditValue('description', service.description);
    setEditValue('price', service.price);
    setEditValue('duration_minutes', service.duration_minutes || 0); // Handle potential undefined duration
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Services</h1>
        {/* Add Service Dialog Trigger */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <div>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
              </Button>
            </div>
          </DialogTrigger>
          {/* Add Service Dialog Content */}
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Fill in the details for the new service you want to offer.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
              {/* Form fields for adding service */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" {...register('name')} className="col-span-3" />
                {errors.name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input id="category" {...register('category')} className="col-span-3" />
                 {errors.category && <p className="col-span-4 text-red-500 text-sm text-right">{errors.category.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" {...register('description')} className="col-span-3" />
                 {errors.description && <p className="col-span-4 text-red-500 text-sm text-right">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price ($)
                </Label>
                <Input id="price" type="number" step="0.01" {...register('price')} className="col-span-3" />
                 {errors.price && <p className="col-span-4 text-red-500 text-sm text-right">{errors.price.message}</p>}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration_minutes" className="text-right">
                  Duration (min)
                </Label>
                <Input id="duration_minutes" type="number" {...register('duration_minutes')} className="col-span-3" />
                 {errors.duration_minutes && <p className="col-span-4 text-red-500 text-sm text-right">{errors.duration_minutes.message}</p>}
              </div>
               {/* Display general form error */}
              {error && (
                <Alert variant="destructive" className="col-span-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => { reset(); setError(null); }}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Service
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Service Dialog */} 
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {/* No trigger here, opened programmatically by handleEditClick */} 
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the details for this service.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onUpdateSubmit)} className="grid gap-4 py-4">
            {/* Form fields for editing service - use registerEdit */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input id="edit-name" {...registerEdit('name')} className="col-span-3" />
              {editErrors.name && <p className="col-span-4 text-red-500 text-sm text-right">{editErrors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <Input id="edit-category" {...registerEdit('category')} className="col-span-3" />
              {editErrors.category && <p className="col-span-4 text-red-500 text-sm text-right">{editErrors.category.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea id="edit-description" {...registerEdit('description')} className="col-span-3" />
              {editErrors.description && <p className="col-span-4 text-red-500 text-sm text-right">{editErrors.description.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price ($)
              </Label>
              <Input id="edit-price" type="number" step="0.01" {...registerEdit('price')} className="col-span-3" />
              {editErrors.price && <p className="col-span-4 text-red-500 text-sm text-right">{editErrors.price.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-duration_minutes" className="text-right">
                Duration (min)
              </Label>
              <Input id="edit-duration_minutes" type="number" {...registerEdit('duration_minutes')} className="col-span-3" />
              {editErrors.duration_minutes && <p className="col-span-4 text-red-500 text-sm text-right">{editErrors.duration_minutes.message}</p>}
            </div>
            {/* Display general form error */}
            {error && (
              <Alert variant="destructive" className="col-span-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={() => { setEditingService(null); resetEdit(); setError(null); }}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Display Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      )}

      {/* Display fetch error if not loading */}
      {!loading && error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error Loading Services</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Display services list or 'no services' message */}
      
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.length > 0 ? (
          services.map((service: any) => (
            <Card key={service.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-teal-700 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {service.name}
                    <Badge variant={service.status === 'active' ? 'default' : 'destructive'}>
                      {service.status || 'inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-500 hover:text-teal-600" 
                    onClick={() => handleEditClick(service)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Service</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this service? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                </CardTitle>
                {service.category && (
                  <Badge variant="secondary" className="mt-1 w-fit">{service.category}</Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800">${service.price.toFixed(2)}</span>
                  {service.duration_minutes && (
                    <span className="text-gray-500">{service.duration_minutes} min</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-1 md:col-span-2 lg:col-span-3">You haven't added any services yet.</p>
        )
      }
      </div>
        )
        }

  </div>
);
};

export default ProviderServices;