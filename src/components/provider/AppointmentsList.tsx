import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

interface Appointment {
  id: number;
  patient?: {
    first_name: string;
    last_name: string;
  };
  service?: {
    name: string;
  };
  scheduled_time?: string;
  status?: string;
  notes?: string;
}

export default function ProviderAppointmentsList() {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication required.");
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/appointments/`;
        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : data.appointments || []);
      } catch (err: any) {
        setError(err.message || "Could not fetch appointments.");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [getToken]);

  if (loading) {
    return (
      <div className="mt-10 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-red-600 mt-10">{error}</div>;
  }
  if (!appointments.length) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No appointments found.
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow key={appt.id} className="hover:bg-gray-50 py-4">
                  <TableCell className="font-medium p-4">{appt.id}</TableCell>
                  <TableCell>
                    {appt.scheduled_time ? (
                      new Date(appt.scheduled_time).toLocaleString()
                    ) : (
                      <span className="text-gray-400">No date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {`${appt.patient?.first_name} ${appt.patient?.last_name}` || (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {appt.service?.name || (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs max-w-xs truncate">
                    {appt.notes || <span className="text-gray-300">-</span>}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        appt.status?.toLowerCase() === "completed"
                          ? "default"
                          : "outline"
                      }
                      className="text-xs px-2 py-0.5"
                    >
                      {appt.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Navigate to video call interface with appointment ID
                        navigate(`../video-call/${appt.id}`);
                      }}
                    >
                      Join Session
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
