"use client";

import { useState } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { CornerDownLeft, Sparkles } from "lucide-react";
import posthog from "posthog-js";
import { usePlayerControls } from "@/components/lesson/player-context";
import { formatTimestamp } from "@/lib/format";
import { MAX_QUESTION_LENGTH, type LessonQaResponse } from "@/lib/lesson-qa/types";

/**
 * Ask a question about this lesson. The answer comes from `/api/lesson-qa`, which reads
 * only this lesson's notes and transcript — so the panel says that plainly, and shows
 * the moments the answer rests on as controls that seek the video.
 *
 * Every citation is a real ingested second, resolved server-side (AGENTS §7). Nothing
 * here derives or formats a timestamp of its own beyond display.
 */

type State =
  | { status: "idle" }
  | { status: "asking"; question: string }
  | { status: "answered"; question: string; reply: LessonQaResponse }
  | { status: "error"; message: string };

export function AskPanel({
  lessonId,
  lessonSlug,
  courseSlug,
}: {
  lessonId: string;
  lessonSlug: string;
  courseSlug?: string;
}) {
  const { isSignedIn } = useAuth();
  const { seekTo } = usePlayerControls();
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function ask() {
    const asked = question.trim();
    if (asked.length < 3 || state.status === "asking") return;

    setState({ status: "asking", question: asked });
    try {
      const response = await fetch("/api/lesson-qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonId, question: asked }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setState({
          status: "error",
          message: data?.error ?? "Could not answer that right now.",
        });
        return;
      }
      setState({ status: "answered", question: asked, reply: data as LessonQaResponse });
    } catch {
      setState({ status: "error", message: "Could not reach the server." });
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="flex items-start gap-2 text-small text-ink-muted">
          <Sparkles size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
          Answers come only from this lesson&rsquo;s notes and transcript. Anything it
          does not cover, it will say so.
        </p>

        {state.status === "asking" && (
          <p className="mt-6 text-body text-ink-muted" role="status">
            Reading the lesson…
          </p>
        )}

        {state.status === "error" && (
          <p className="mt-6 text-body text-danger" role="status">
            {state.message}
          </p>
        )}

        {state.status === "answered" && (
          <div className="mt-6">
            <p className="text-data text-ink-disabled">{state.question}</p>

            {state.reply.answered ? (
              <>
                <p className="mt-3 text-body text-ink">{state.reply.answer}</p>
                {state.reply.citations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-meta text-ink-muted">In the video</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {state.reply.citations.map((citation) => (
                        <li key={citation.seconds}>
                          <button
                            type="button"
                            onClick={() => {
                              seekTo(citation.seconds);
                              posthog.capture("transcript_seek", {
                                lesson_slug: lessonSlug,
                                course_slug: courseSlug,
                                seconds: citation.seconds,
                                source: "answer",
                              });
                            }}
                            className="flex w-full gap-3 rounded-sm border border-line p-3 text-left transition-colors hover:border-line-strong hover:bg-raised"
                          >
                            <span className="shrink-0 text-data text-moment">
                              {formatTimestamp(citation.seconds)}
                            </span>
                            <span className="line-clamp-2 text-small text-ink-muted">
                              {citation.text}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-3 text-body text-ink-muted">
                This lesson does not cover that. Try the search to find a lesson that does.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line p-4">
        {isSignedIn ? (
          <div className="relative">
            <label htmlFor="ask-lesson" className="sr-only">
              Ask about this lesson
            </label>
            <textarea
              id="ask-lesson"
              rows={2}
              value={question}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                // Enter asks; Shift+Enter is a newline, as in every chat field.
                if (event.key !== "Enter" || event.shiftKey) return;
                event.preventDefault();
                ask();
              }}
              placeholder="Ask about this lesson…"
              className="w-full resize-none rounded-sm border border-line bg-surface p-3 pr-11 text-[14px] text-ink placeholder:text-ink-disabled hover:border-line-strong focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={ask}
              disabled={question.trim().length < 3 || state.status === "asking"}
              aria-label="Ask"
              className="absolute right-2 bottom-3 inline-flex size-8 items-center justify-center rounded-xs bg-accent text-on-accent transition-colors hover:bg-accent-hover disabled:bg-raised disabled:text-ink-disabled"
            >
              <CornerDownLeft size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="text-body text-ink-muted">
            <SignInButton>
              <button type="button" className="text-accent hover:text-accent-hover">
                Sign in
              </button>
            </SignInButton>{" "}
            to ask about this lesson.
          </p>
        )}
      </div>
    </div>
  );
}
