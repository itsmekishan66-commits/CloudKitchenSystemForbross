const inFlight = new Map<string, Promise<unknown>>()

export function dedupedFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const key = `${url}-${JSON.stringify(options)}`
  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      fetch(url, options)
        .then((res) => {
          inFlight.delete(key)
          return res.json() as T
        })
        .catch((err) => {
          inFlight.delete(key)
          throw err
        }),
    )
  }
  return inFlight.get(key) as Promise<T>
}
