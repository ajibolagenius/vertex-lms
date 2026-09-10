"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * The bridge between the video and everything beside it (the transcript today; the
 * ask and quiz panels next).
 *
 * Two contexts on purpose: the controls never change identity, so registering the
 * player is a one-shot effect, while the position ticks and only re-renders what
 * actually reads it.
 */

type Controls = {
  /** Jump to this second, starting playback if it has not begun. */
  seekTo: (seconds: number) => void;
  /** Called by the player to publish its seek function; `null` on unmount. */
  registerSeek: (seek: ((seconds: number) => void) | null) => void;
  /** Called by the player's poll with the current second. */
  reportPosition: (seconds: number) => void;
};

const NOOP: Controls = {
  seekTo: () => {},
  registerSeek: () => {},
  reportPosition: () => {},
};

const ControlsContext = createContext<Controls>(NOOP);
const PositionContext = createContext<number>(0);

export function LessonPlayerProvider({ children }: { children: ReactNode }) {
  const seek = useRef<((seconds: number) => void) | null>(null);
  const [position, setPosition] = useState(0);

  const controls = useMemo<Controls>(
    () => ({
      seekTo: (seconds) => {
        // Optimistic: the panel highlights the target immediately, and the player's
        // next poll confirms it a moment later.
        setPosition(seconds);
        seek.current?.(seconds);
      },
      registerSeek: (fn) => {
        seek.current = fn;
      },
      reportPosition: setPosition,
    }),
    [],
  );

  return (
    <ControlsContext value={controls}>
      <PositionContext value={position}>{children}</PositionContext>
    </ControlsContext>
  );
}

export function usePlayerControls() {
  return useContext(ControlsContext);
}

export function usePlayerPosition() {
  return useContext(PositionContext);
}
