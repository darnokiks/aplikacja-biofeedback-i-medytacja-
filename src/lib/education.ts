// Repozytorium wideo instruktażowych i nagrań audio z wykładami "po co dana metoda" — ten sam
// wzorzec manifestu co przy muzyce (lib/audio.ts) i narracji (lib/narration.ts): puste dziś,
// gotowe do podpięcia prawdziwych plików później. Patrz public/video/README.md i
// public/audio/README.md po pełną instrukcję i listę oczekiwanych ID.

export const LECTURE_VIDEO_MANIFEST: Record<string, string> = {
  // wimhof: '/video/education/wimhof.mp4',
};

export const LECTURE_AUDIO_MANIFEST: Record<string, string> = {
  // wimhof: '/audio/lectures/wimhof.mp3',
};

export function getLectureVideoSrc(moduleId: string): string | null {
  return LECTURE_VIDEO_MANIFEST[moduleId] ?? null;
}

export function getLectureAudioSrc(moduleId: string): string | null {
  return LECTURE_AUDIO_MANIFEST[moduleId] ?? null;
}
