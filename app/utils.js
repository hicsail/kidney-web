// Returns last /-separated segment of a string.
export function removeFilepathPrefix(filepath) {
  if (filepath == null) {
    return "";
  }
  if (filepath.endsWith("/")){
    return filepath.split("/").at(-2);
  }
  return filepath.split("/").at(-1);
}

export function changeExtension(filename, ext) {
  if (filename == null) {
    console.log("changeExtension got empty filename");
    return "";
  }
  return filename.split(".").slice(0, -1).join(".") + "." + ext;
}
