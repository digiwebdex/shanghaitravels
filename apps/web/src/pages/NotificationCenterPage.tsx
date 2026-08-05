import { Bell } from "lucide-react";
import { PageHeader, PageShell, Surface } from "@/components/enterprise/Page";
import { NotificationCenter } from "@/components/enterprise/NotificationCenter";

export default function NotificationCenterPage() {
  return (
    <PageShell>
      <PageHeader
        icon={Bell}
        title="Notification Center"
        subtitle="Outbound communications & automation notifications — the same component every portal reuses."
        breadcrumb={[{ label: "Administration" }, { label: "Notifications" }]}
      />
      <Surface padded>
        <NotificationCenter />
      </Surface>
    </PageShell>
  );
}
