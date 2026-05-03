import type { ComplaintDisplay } from "../../types/complaint";
import { ComplaintItem } from "../ComplaintItem";
import { TopicComplaintCommentsAccordion } from "./TopicComplaintCommentsAccordion";
import { cn } from "../../lib/utils";

export function TopicComplaintRow({
  complaint,
  topicSlug,
  currentUserId,
  currentUserRole,
  isSubscribed,
  initialOpenComments,
}: {
  complaint: ComplaintDisplay;
  topicSlug: string;
  currentUserId: string | null;
  currentUserRole: string | null;
  isSubscribed: boolean;
  initialOpenComments?: boolean;
}) {
  return (
    <div id={`topic-complaint-${complaint.id}`} className="scroll-mt-28 space-y-0">
      <ComplaintItem
        complaint={complaint}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        isSubscribed={isSubscribed}
        returnTopicSlug={topicSlug}
        className={cn(
          "rounded-b-none border-b-0 shadow-none ring-0",
          "hover:border-b-0 hover:shadow-none dark:hover:ring-0"
        )}
      />
      <TopicComplaintCommentsAccordion
        complaintId={complaint.id}
        topicSlug={topicSlug}
        currentUserId={currentUserId}
        initialOpen={initialOpenComments}
      />
    </div>
  );
}
