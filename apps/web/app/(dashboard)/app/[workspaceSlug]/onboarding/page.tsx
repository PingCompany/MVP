"use client";

import { use } from "react";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

interface Props {
  params: Promise<{ workspaceSlug: string }>;
}

export default function WorkspaceOnboardingPage({ params }: Props) {
  const { workspaceSlug } = use(params);
  return <OnboardingWizard targetWorkspaceSlug={workspaceSlug} />;
}
