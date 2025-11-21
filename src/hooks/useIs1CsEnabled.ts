export function useIs1CsEnabled() {
  // Legacy swap is currently disabled - always use 1cs
  // TODO: remove legacy swap entirely including this flag, environment variable, and all related code
  return true
}
