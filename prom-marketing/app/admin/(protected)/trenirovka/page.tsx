import { TrainingDashboard } from "@/components/admin/trenirovka/TrainingDashboard";
import { getTrainingDashboard } from "@/lib/trening/repository";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  return <TrainingDashboard data={await getTrainingDashboard()} />;
}
