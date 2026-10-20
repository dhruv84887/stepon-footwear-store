export function resolveAsset(path) {
  if (!path || /^(?:https?:|data:|blob:)/i.test(path)) return path;
  if (path.startsWith('/')) return `${import.meta.env.BASE_URL}${path.slice(1)}`;
  return path;
}
