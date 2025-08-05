import {
  type MutableRefObject,
  type Ref,
  type RefCallback,
  useCallback,
} from "react"

function useMergedRef<T>(...refs: Ref<T>[]): RefCallback<T> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are fine
  return useCallback((element: T) => {
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i]
      if (typeof ref === "function") ref(element)
      else if (ref && typeof ref === "object")
        (ref as MutableRefObject<T>).current = element
    }
  }, refs)
}

export default useMergedRef
