import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  custom_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
  provider_id: number;
  provider: {
    id: number;
    first_name: string;
    last_name: string;
    specialty: string;
    status: string;
  };
}

export default function ServicesManagement() {
  const { getToken } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not available.");
      }

      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/services/?page=${page}&limit=${limit}${
        appliedSearchTerm
          ? `&search=${encodeURIComponent(appliedSearchTerm)}`
          : ""
      }`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          //   console.log("Unauthorized: " + await response.text());
          throw new Error(
            "Unauthorized - Please check your authentication token."
          );
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to fetch services: ${response.statusText}`
        );
      }

      const data = await response.json();

      setServices(data);
    } catch (err: any) {
      console.error("Error fetching services:", err);
      if (err.message.includes("Unauthorized")) {
        setError("Session expired. Please log in again.");
      } else {
        setError(
          err.message || "An unexpected error occurred while fetching services."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusToggle = async (service: Service) => {
    setIsUpdatingStatus(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available");

      const newStatus =
        service.status?.toLowerCase() === "active" ? "inactive" : "active";
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/services/${service.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update service status");
      }

      // Update local state immediately
      setServices(
        services.map((s) =>
          s.id === service.id ? { ...s, status: newStatus } : s
        )
      );

      if (selectedService?.id === service.id) {
        setSelectedService({ ...selectedService, status: newStatus });
      }

      // Refresh data from server
      fetchServices();
    } catch (err: any) {
      console.error("Error updating service status:", err);
      setError(err.message || "Failed to update service status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUpdateCustomRate = async (serviceId: number) => {
    setIsUpdatingRate(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not available");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/services/${serviceId}/custom-rate`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ custom_rate: customRate }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update custom rate");
      }

      // Refresh services
      fetchServices();
      setCustomRate(0);
    } catch (err: any) {
      console.error("Error updating custom rate:", err);
      setError(err.message || "Failed to update custom rate");
    } finally {
      setIsUpdatingRate(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [getToken, page, limit, appliedSearchTerm]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [customRate, setCustomRate] = useState<number>(0);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-4 mt-10">
      <Card className={`${selectedService ? "w-2/3" : "w-full"}`}>
        <CardHeader>
          <CardTitle className="text-primary">Services Management</CardTitle>
          <CardDescription className="text-primary/80">
            View and manage clinic services.
          </CardDescription>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm text-primary"
            />
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => {
                setAppliedSearchTerm(searchTerm);
                setPage(1);
              }}
            >
              Search
            </Button>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded-md p-2 text-sm text-primary"
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
              <p className="text-primary">Error: {error}</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-primary">Name</TableHead>
                  <TableHead className="text-primary">Description</TableHead>
                  <TableHead className="text-primary">Price</TableHead>
                  <TableHead className="text-primary">Duration</TableHead>
                  <TableHead className="text-primary">Category</TableHead>
                  <TableHead className="text-primary">Status</TableHead>
                  <TableHead className="text-primary">Provider</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : services?.length > 0 ? (
                  services?.map((service) => (
                    <TableRow
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell>{service.description || "N/A"}</TableCell>
                      <TableCell>${service.price}</TableCell>
                      <TableCell>{service.duration} mins</TableCell>
                      <TableCell>{service.category || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant={
                            service.status?.toLowerCase() === "active"
                              ? "default"
                              : "outline"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusToggle(service);
                          }}
                          disabled={isUpdatingStatus}
                          className="w-24"
                          size="sm"
                        >
                          {service.status || "Unknown"}
                        </Button>
                      </TableCell>

                      <TableCell>
                        {service.provider
                          ? `${service.provider.first_name} ${service.provider.last_name}`
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500 py-4"
                    >
                      No services found.
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
                className="text-primary border-primary"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary"
                onClick={() => setPage(page + 1)}
                disabled={services?.length < limit}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedService && (
        <Card className="w-1/3">
          <CardHeader>
            <CardTitle className="text-primary">Service Details</CardTitle>
            <div className="flex justify-end gap-2">
              <Button
                variant="destructive"
                className="w-24 text-primary-foreground bg-destructive"
                onClick={() => handleStatusToggle(selectedService)}
                disabled={
                  isUpdatingStatus ||
                  selectedService.status?.toLowerCase() !== "active"
                }
                size="sm"
              >
                Deactivate
              </Button>
              <Button
                variant="default"
                className="w-24 bg-primary text-primary-foreground"
                onClick={() => handleStatusToggle(selectedService)}
                disabled={
                  isUpdatingStatus ||
                  selectedService.status?.toLowerCase() === "active"
                }
                size="sm"
              >
                Activate
              </Button>
            </div>
            <CardDescription className="text-primary/80">
              Detailed information about the selected service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {selectedService.name}
              </h3>
              <p className="text-sm text-primary/80">
                {selectedService.description}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={customRate}
                onChange={(e) => setCustomRate(parseFloat(e.target.value))}
                className="w-24 text-primary"
                placeholder="Rate"
              />
              <Button
                className="bg-primary text-primary-foreground"
                onClick={() => handleUpdateCustomRate(selectedService.id)}
                disabled={isUpdatingRate || !customRate}
                size="sm"
              >
                {isUpdatingRate ? "Updating..." : "Set Rate"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-primary/70">Price</p>
                <p className="text-primary">${selectedService.price}</p>
              </div>
              <div>
                <p className="text-sm text-primary/70">Custom Rate</p>
                <p className="text-primary">
                  {selectedService.custom_rate
                    ? `$${selectedService.custom_rate.toFixed(2)}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-primary/70">Duration</p>
                <p className="text-primary">{selectedService.duration} mins</p>
              </div>
              <div>
                <p className="text-sm text-primary/70">Category</p>
                <p className="text-primary">
                  {selectedService.category || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-primary/70">Status</p>
                <Badge
                  variant={
                    selectedService.status?.toLowerCase() === "active"
                      ? "default"
                      : "destructive"
                  }
                  className="bg-primary text-primary-foreground"
                >
                  {selectedService.status || "Unknown"}
                </Badge>
              </div>
            </div>

            {selectedService.provider && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-primary">
                  Provider Information
                </h4>
                <p className="text-primary">
                  {selectedService.provider.first_name}{" "}
                  {selectedService.provider.last_name}
                </p>
                <p className="text-sm text-primary/80">
                  {selectedService.provider.specialty}
                </p>
                <Badge
                  variant={
                    selectedService.provider.status?.toLowerCase() === "active"
                      ? "default"
                      : "destructive"
                  }
                  className="mt-2 bg-primary text-primary-foreground"
                >
                  {selectedService.provider.status || "Unknown"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
