import { UserLayout } from "@/components/layout/user-layout";
import PerformanceLoggingPage from "./performance-logging";

export default function Performance() {
  return (
    <UserLayout title="ثبت آمار کارکرد">
      <PerformanceLoggingPage />
    </UserLayout>
  );
}