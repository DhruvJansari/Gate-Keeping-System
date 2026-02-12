import { ProtectedRoute } from "@/components/ProtectedRoute";
import UserDashboard from "@/components/UserDashboard";

export default function GatekeeperDashboard() {
  return (
    <ProtectedRoute allowedRoles={['Gatekeeper']}>
      <UserDashboard roleName="Gatekeeper" />
    </ProtectedRoute>
  );
}
