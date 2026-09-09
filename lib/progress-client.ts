/** The browser's only write (AGENTS §5): it posts to the server route, never to Sanity. */
export async function saveProgress(body: {
  lessonId: string;
  completed?: boolean;
  positionSeconds?: number;
}): Promise<boolean> {
  try {
    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    // Progress is not worth an error state on the page — the next view records it again.
    return false;
  }
}
