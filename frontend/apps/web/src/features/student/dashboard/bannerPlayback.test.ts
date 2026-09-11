import assert from "node:assert/strict";
import test from "node:test";

const playbackModulePath = "./bannerPlayback.ts";
const { getBannerPlaybackOptions } = await import(playbackModulePath);

test("autoplay banners start muted, loop, and hide controls", () => {
  assert.deepEqual(getBannerPlaybackOptions(true, "/poster.webp"), {
    controls: false,
    light: false,
    loop: true,
    muted: true,
    playing: true,
  });
});

test("manual-play banners retain controls and poster preview", () => {
  assert.deepEqual(getBannerPlaybackOptions(false, "/poster.webp"), {
    controls: true,
    light: "/poster.webp",
    loop: false,
    muted: false,
    playing: false,
  });
});
