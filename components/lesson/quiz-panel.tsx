"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Check, Play, RotateCcw, X } from "lucide-react";
import posthog from "posthog-js";
import { usePlayerControls } from "@/components/lesson/player-context";
import { formatTimestamp } from "@/lib/format";
import { saveProgress } from "@/lib/progress-client";
import { askable, grade, type Question } from "@/lib/quiz";
import { invalidateProgress } from "@/lib/use-progress";
import { cn } from "@/lib/utils";

/**
 * The lesson quiz: one question at a time, then a score and an explanation for each.
 *
 * Answers ship to the browser with the questions and grading happens here. That is
 * deliberate — this is a learning aid, not an exam, and nothing is gated on the result.
 * The score is written through the server route like every other piece of progress
 * (AGENTS §5); a signed-out learner can still take it, it just is not recorded.
 *
 * A wrong answer offers the moment the point is taught, which is an ingested second,
 * never a computed one.
 */
export function QuizPanel({
  lessonId,
  lessonSlug,
  courseSlug,
  questions,
}: {
  lessonId: string;
  lessonSlug: string;
  courseSlug?: string;
  questions: Question[];
}) {
  const { isSignedIn } = useAuth();
  const { seekTo } = usePlayerControls();
  const asked = useMemo(() => askable(questions), [questions]);

  const [answers, setAnswers] = useState<(number | null)[]>(() => asked.map(() => null));
  const [at, setAt] = useState(0);
  const [done, setDone] = useState(false);

  if (!asked.length) {
    return (
      <p className="px-5 py-6 text-body text-ink-muted">
        This lesson has no quiz yet.
      </p>
    );
  }

  const result = grade(asked, answers);

  function choose(option: number) {
    setAnswers((current) => current.map((value, index) => (index === at ? option : value)));
  }

  async function finish() {
    setDone(true);
    const final = grade(asked, answers);
    posthog.capture("quiz_completed", {
      lesson_slug: lessonSlug,
      course_slug: courseSlug,
      score: final.percent,
      correct: final.correct,
      total: final.total,
    });
    if (!isSignedIn) return;
    const ok = await saveProgress({ lessonId, quizScore: final.percent });
    if (ok) invalidateProgress();
  }

  function restart() {
    setAnswers(asked.map(() => null));
    setAt(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <p className="text-meta text-ink-muted">Your score</p>
        <p className="mt-2 text-title text-ink">
          {result.correct}/{result.total}
          <span className="ml-2 text-data text-ink-muted">{result.percent}%</span>
        </p>
        {!isSignedIn && (
          <p className="mt-2 text-small text-ink-muted">
            Sign in to keep your score with the rest of your progress.
          </p>
        )}

        <ol className="mt-6 flex flex-col gap-5">
          {asked.map((question, index) => {
            const graded = result.graded[index];
            return (
              <li key={question.question} className="border-t border-line pt-4">
                <p className="flex gap-2 text-body text-ink">
                  {graded.isCorrect ? (
                    <Check size={15} aria-hidden="true" className="mt-1 shrink-0 text-success" />
                  ) : (
                    <X size={15} aria-hidden="true" className="mt-1 shrink-0 text-danger" />
                  )}
                  {question.question}
                </p>
                <p className="mt-2 text-small text-ink-muted">
                  {graded.isCorrect
                    ? question.explanation
                    : `Answer: ${question.options[question.answerIndex]} — ${question.explanation}`}
                </p>
                {!graded.isCorrect && question.startSeconds !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      seekTo(question.startSeconds as number);
                      posthog.capture("transcript_seek", {
                        lesson_slug: lessonSlug,
                        course_slug: courseSlug,
                        seconds: question.startSeconds,
                        source: "quiz",
                      });
                    }}
                    className="mt-2 inline-flex items-center gap-2 text-data text-moment hover:underline"
                  >
                    <Play size={12} aria-hidden="true" className="fill-current" />
                    Watch from {formatTimestamp(question.startSeconds)}
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={restart}
          className="mt-6 inline-flex items-center gap-2 text-body text-accent hover:text-accent-hover"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  const question = asked[at];
  const chosen = answers[at];
  const isLast = at === asked.length - 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <p className="text-meta text-ink-muted">
          Question {at + 1} of {asked.length}
        </p>
        <p className="mt-3 text-body text-ink">{question.question}</p>

        <ul className="mt-4 flex flex-col gap-2">
          {question.options.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                aria-pressed={chosen === index}
                onClick={() => choose(index)}
                className={cn(
                  "w-full rounded-sm border p-3 text-left text-body transition-colors",
                  chosen === index
                    ? "border-accent bg-accent-soft text-ink"
                    : "border-line text-ink-muted hover:border-line-strong hover:bg-raised",
                )}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line p-4">
        <button
          type="button"
          onClick={() => setAt((value) => Math.max(0, value - 1))}
          disabled={at === 0}
          className="text-body text-ink-muted transition-colors hover:text-ink disabled:text-ink-disabled"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => (isLast ? finish() : setAt((value) => value + 1))}
          disabled={chosen === null}
          className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-[14px] font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:bg-raised disabled:text-ink-disabled"
        >
          {isLast ? "See score" : "Next"}
        </button>
      </div>
    </div>
  );
}
