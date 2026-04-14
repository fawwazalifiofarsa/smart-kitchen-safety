import { AlertDetailClient } from "./alert-detail-client";

type Params = {
  params: Promise<{ alertId: string }>;
};

export default async function AlertDetailPage({ params }: Params) {
  const { alertId } = await params;
  return <AlertDetailClient alertId={alertId} />;
}
