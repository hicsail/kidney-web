// Returns last /-separated segment of a string.
export function removeFilepathPrefix(filepath) {
  if (filepath == null) {
    return "";
  }
  return filepath.split("/").at(-1);
}
