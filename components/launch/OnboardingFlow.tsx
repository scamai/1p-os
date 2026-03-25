"use client";

import { useState } from "react";
import { Walkthrough } from "@/components/launch/Walkthrough";
import { OnboardingQuiz } from "@/components/launch/OnboardingQuiz";

export function OnboardingFlow() {
  const [walkthroughDone, setWalkthroughDone] = useState(false);

  if (!walkthroughDone) {
    return <Walkthrough onComplete={() => setWalkthroughDone(true)} />;
  }

  return <OnboardingQuiz />;
}
