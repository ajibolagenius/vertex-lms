"use client";

import { useState } from "react";
import { AskPanel } from "@/components/lesson/ask-panel";
import { QuizPanel } from "@/components/lesson/quiz-panel";
import { TranscriptPanel } from "@/components/lesson/transcript-panel";
import type { Question } from "@/lib/quiz";
import type { Chapter, Chunk } from "@/lib/transcript";
import { cn } from "@/lib/utils";

/**
 * The rail beside the lesson. One panel at a time, because at 380px two would be a list
 * of scrollbars.
 *
 * A lesson whose video has not been ingested has no transcript, so that tab is simply
 * not offered — asking still works, from the notes alone. Same for a lesson with no
 * generated quiz.
 */
export function LessonRail({
  lessonId,
  lessonSlug,
  courseSlug,
  chapters,
  chunks,
  quiz,
}: {
  lessonId: string;
  lessonSlug: string;
  courseSlug?: string;
  chapters: Chapter[];
  chunks: Chunk[];
  quiz: Question[];
}) {
  const hasTranscript = chunks.length > 0;
  const hasQuiz = quiz.length > 0;
  const [tab, setTab] = useState<"transcript" | "ask" | "quiz">(
    hasTranscript ? "transcript" : "ask",
  );

  const tabs = [
    ...(hasTranscript ? ([{ id: "transcript", label: "Transcript" }] as const) : []),
    { id: "ask", label: "Ask" } as const,
    ...(hasQuiz ? ([{ id: "quiz", label: "Quiz" }] as const) : []),
  ];

  return (
    <>
      <div role="tablist" aria-label="Lesson tools" className="flex border-b border-line">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "-mb-px border-b px-5 py-3 text-meta transition-colors",
              tab === id
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "transcript" && hasTranscript && (
        <TranscriptPanel
          chapters={chapters}
          chunks={chunks}
          lessonSlug={lessonSlug}
          courseSlug={courseSlug}
        />
      )}
      {tab === "ask" && (
        <AskPanel lessonId={lessonId} lessonSlug={lessonSlug} courseSlug={courseSlug} />
      )}
      {tab === "quiz" && hasQuiz && (
        <QuizPanel
          lessonId={lessonId}
          lessonSlug={lessonSlug}
          courseSlug={courseSlug}
          questions={quiz}
        />
      )}
    </>
  );
}
