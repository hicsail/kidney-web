export function removeUserdirPrefix(filepath) {
  if (filepath == null) {
    return "";
  }
  return filepath.split("/", 2)[1];
}
