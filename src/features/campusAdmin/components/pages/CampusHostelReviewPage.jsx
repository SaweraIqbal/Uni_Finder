import HostelReviewDashboard from "../../../../shared/components/HostelReviewDashboard";
import { useCampusAdmin } from "../CampusAdminContext";

export default function CampusHostelReviewPage() {
  const { campus, setHostelRequestCount } = useCampusAdmin();
  return (
    <HostelReviewDashboard
      reviewer="campus"
      campus={campus}
      onQueueChange={setHostelRequestCount}
    />
  );
}
