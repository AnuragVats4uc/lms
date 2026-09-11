export function getBannerPlaybackOptions(
  autoplay: boolean,
  posterUrl: string | null,
) {
  return {
    controls: !autoplay,
    light: autoplay ? false : posterUrl || false,
    loop: autoplay,
    muted: autoplay,
    playing: autoplay,
  } as const;
}
