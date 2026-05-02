import { DeviceDetailClient } from "./device-detail-client";

type Params = {
  params: Promise<{ deviceId: string }>;
};

export default async function DeviceDetailPage({ params }: Params) {
  const { deviceId } = await params;
  return <DeviceDetailClient deviceId={deviceId} />;
}
