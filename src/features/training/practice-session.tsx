"use client";

import { ClozePractice } from "./cloze-practice";
import { ZhToEnPractice } from "./zh-to-en-practice";
import type { PracticeSessionData } from "./types";

type PracticeSessionProps = {
  session: PracticeSessionData;
};

export function PracticeSession({ session }: PracticeSessionProps) {
  const segments = session.material.segments;
  const materialTitle = session.material.title;

  if (session.mode === "cloze") {
    return (
      <ClozePractice
        sessionId={session.id}
        materialId={session.materialId}
        materialTitle={materialTitle}
        segments={segments}
      />
    );
  }

  return (
    <ZhToEnPractice
      sessionId={session.id}
      materialId={session.materialId}
      materialTitle={materialTitle}
      segments={segments}
    />
  );
}
