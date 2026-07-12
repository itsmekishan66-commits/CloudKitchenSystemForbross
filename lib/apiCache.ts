export function cacheHeaders(durationSeconds = 60) {
  return {
    "Cache-Control": `public, s-maxage=${durationSeconds}, stale-while-revalidate=${durationSeconds * 5}`,
  }
}
