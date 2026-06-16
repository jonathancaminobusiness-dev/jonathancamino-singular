import { getPath } from '../inject.js'
import { setPath } from '../extract.js'

export function createState(initial) {
  let content = initial
  const subs = new Set()
  return {
    get() { return content },
    getKey(path) { return getPath(content, path) },
    setKey(path, value) {
      setPath(content, path, value)
      subs.forEach((cb) => cb(content))
    },
    subscribe(cb) { subs.add(cb); return () => subs.delete(cb) },
  }
}
