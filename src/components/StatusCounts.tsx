import { Badge } from "@/components/ui/badge";
import type { StatusCountsDTO } from "@/types";

interface StatusCountsProps {
  counts: StatusCountsDTO;
}

export const StatusCounts = ({ counts }: StatusCountsProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Pending:</span>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          {counts.pending}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Approved:</span>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {counts.approved}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Rejected:</span>
        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {counts.rejected}
        </Badge>
      </div>
    </div>
  );
};
