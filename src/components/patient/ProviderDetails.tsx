import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { useAuth } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Import Button
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft icon
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  status: string;
}

interface Appointment {
  id: number;
  patient_name?: string;
  date?: string;
  scheduled_time?: string;
  status?: string;
  // Add more fields as needed based on your API response
}

export default function ProviderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Initialize navigate
  const { getToken } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [_bookingSuccess, setBookingSuccess] = useState(false);

  // Extract fetchData so it can be reused
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");
      // Get provider (now includes services and appointments)
      const providerRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/providers/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!providerRes.ok) throw new Error("Failed to fetch provider details");
      const providerData = await providerRes.json();
      setProvider(providerData);
      setServices(
        Array.isArray(providerData.services) ? providerData.services : []
      );
      setAppointments(
        Array.isArray(providerData.appointments)
          ? providerData.appointments
          : []
      );
    } catch (err: any) {
      setError(err.message || "Could not fetch provider details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id, getToken]);

  if (loading)
    return (
      <div className="flex flex-col items-center mt-20">
        <Skeleton className="h-24 w-24 rounded-full mb-4" />
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2 max-w-2xl" />
        <Skeleton className="h-4 w-full mb-4 max-w-2xl" />
      </div>
    );
  if (error)
    return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (!provider)
    return (
      <div className="text-center text-gray-500 mt-10">Provider not found.</div>
    );

  const handleBookClick = (service: Service) => {
    setBookingService(service);
    setShowBooking(true);
    setScheduledTime("");
    setNotes("");
    setBookingError(null);
    setBookingSuccess(false);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !bookingService || !scheduledTime) {
      setBookingError("Please fill all required fields.");
      return;
    }
    setBookingLoading(true);
    setBookingError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");
      const apiUrl = `https://b8ok804ocwcos8g0ww08k4go.coolify.agnieve.com/appointments/`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider_id: provider.id,
          service_id: bookingService.id,
          scheduled_time: new Date(scheduledTime).toISOString(),
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to book appointment.");

      setBookingSuccess(true);
      setShowBooking(false);
      // Refetch provider details (including appointments)
      await fetchData();
    } catch (err: any) {
      setBookingError(err.message || "Could not book appointment.");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 mb-12 px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        Back to Providers
      </Button>
      <Card className="overflow-hidden shadow-xl rounded-xl border border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="flex flex-col items-center bg-gradient-to-b from-background to-muted p-8">
          {provider.photo_url ? (
            <div className="relative h-32 w-32 mb-6 group">
              <img
                src={provider.photo_url}
                alt={`${provider.first_name} ${provider.last_name}`}
                className="h-full w-full rounded-full object-cover border-4 border-background shadow-lg transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-5xl border-4 border-background shadow-lg mb-6">
              {provider.first_name?.[0] || "?"}
              {provider.last_name?.[0] || ""}
            </div>
          )}
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            {provider.first_name} {provider.last_name}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2 mb-4">
            {provider.specialty || "N/A"}
            <span className="mx-3 text-border">•</span>
            <Badge
              variant={
                provider.status?.toLowerCase() === "active"
                  ? "default"
                  : "destructive"
              }
              className="text-sm px-3 py-1 rounded-full"
            >
              {provider.status || "Unknown"}
            </Badge>
          </CardDescription>
          <div className="text-muted-foreground text-sm flex items-center gap-1">
            {provider.clinic_name && (
              <>
                <span>{provider.clinic_name}</span>
                <span className="text-border">•</span>
              </>
            )}
            <span>{provider.city}, {provider.state}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h2 className="font-semibold text-2xl mb-6 text-foreground border-b pb-3">
            Services Offered
          </h2>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services
                .filter((service) => service.status?.toLowerCase() === "active")
                .map((service) => (
                  <div
                    key={service.id}
                    className="border rounded-xl p-6 bg-card hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="mb-2 sm:mb-0">
                      <div className="font-medium text-gray-900 text-lg">
                        {service.name}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        {service.description || "No description available."}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end sm:items-end w-full sm:w-auto">
                      <span className="text-teal-700 font-semibold text-lg mb-1">
                        ${service.price}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          (
                          {service.duration_minutes || service.duration_minutes}{" "}
                          min)
                        </span>
                        <Badge
                          variant={
                            service.status?.toLowerCase() === "active"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs px-2 py-0.5"
                        >
                          {service.status}
                        </Badge>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleBookClick(service)}
                      >
                        Book Appointment
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8 bg-muted/50 rounded-xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-lg font-medium">No services available</span>
                <span className="text-sm">This provider hasn't listed any services yet</span>
              </div>
            </div>
          )}
          {/* Centered and styled 'no services' message */}
          <h2 className="font-semibold text-2xl mb-6 text-foreground border-b pb-3 mt-10">
            Upcoming Appointments
          </h2>
          {appointments.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-xl p-6 bg-card hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center"
                >
                  <div>
                    <div className="font-medium text-gray-900 text-lg">
                      Appointment #{app.id}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      {app.date
                        ? new Date(app.date).toLocaleString()
                        : app.scheduled_time
                        ? new Date(app.scheduled_time).toLocaleString()
                        : "No date provided"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                    <Badge
                      variant={
                        app.status?.toLowerCase() === "completed"
                          ? "default"
                          : "outline"
                      }
                      className="text-xs px-2 py-0.5"
                    >
                      {app.status || "Unknown"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8 bg-muted/50 rounded-xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-lg font-medium">No appointments scheduled</span>
                <span className="text-sm">This provider doesn't have any upcoming appointments</span>
              </div>
            </div>
          )}
          <Dialog open={showBooking} onOpenChange={setShowBooking}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Book Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Service
                  </label>
                  <Input 
                    value={bookingService?.name || ""} 
                    disabled 
                    className="text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                    className="text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Notes (Optional)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    className="min-h-[100px] text-foreground"
                  />
                </div>
                {bookingError && (
                  <div className="text-destructive text-sm">{bookingError}</div>
                )}
                <DialogFooter className="gap-3 sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBooking(false)}
                    disabled={bookingLoading}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={bookingLoading}
                    className="w-full"
                  >
                    {bookingLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Booking...
                      </span>
                    ) : "Confirm Booking"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
