"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PeriodSelector, type Period } from "./_components/PeriodSelector";
import { UserAnalyticsTab } from "./_components/UserAnalyticsTab";
import { WorkspaceAnalyticsTab } from "./_components/WorkspaceAnalyticsTab";

export default function AnalyticsPage() {
  const { workspaceId, role } = useWorkspace();
  const [period, setPeriod] = useState<Period>("30d");
  const isAdmin = role === "admin";

  if (role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        You don&apos;t have permission to view analytics.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-md font-semibold text-foreground">Analytics</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Decision velocity, context quality, and cognitive load reduction
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <Tabs defaultValue="my-decisions">
        <TabsList>
          <TabsTrigger value="my-decisions">My Decisions</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="workspace-health">Workspace Health</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-decisions">
          <UserAnalyticsTab period={period} workspaceId={workspaceId} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="workspace-health">
            <WorkspaceAnalyticsTab period={period} workspaceId={workspaceId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
