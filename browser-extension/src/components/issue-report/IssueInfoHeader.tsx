import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { IssueData } from "../../types/issue";
import { UsageInfoCard } from "./UsageInfoCard";
import type { Locale } from "@/lib/i18n";

interface UsageInfo {
  resolvedDate: string;
  aiUsage: string;
}

export const IssueInfoHeader = ({
  issueData,
  usageInfo,
  usageWarning,
  onRefresh,
  locale,
}: {
  issueData: IssueData;
  usageInfo: UsageInfo | null;
  usageWarning: string | null;
  onRefresh: () => void;
  locale: Locale;
}) => {
  return (
    <Card className="bg-muted/30 border-muted">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm font-mono">
              #{issueData.id}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {issueData.tracker}
            </Badge>
            {issueData.status && (
              <Badge
                variant="outline"
                className={
                  issueData.status.toLowerCase().includes("closed")
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }
              >
                {issueData.status}
              </Badge>
            )}
          </div>
          <h3 className="text-base font-medium leading-snug">
            {issueData.title}
          </h3>
        </div>
        <div className="mt-3">
          <UsageInfoCard
            usageInfo={usageInfo}
            usageWarning={usageWarning}
            onRefresh={onRefresh}
            locale={locale}
          />
        </div>
      </CardContent>
    </Card>
  );
};
