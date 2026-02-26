import { ProtectedRoute } from "@/components/ProtectedRoute";
import { VehicleManagement } from "@/components/VehicleManagement";

export default function GatekeeperVehiclesPage() {
  return (
    <ProtectedRoute allowedRoles={['Gatekeeper']}>
      <VehicleManagement />
    </ProtectedRoute>
  );
}
