/**
 * Whether a file picked from a `<input type="file" accept="image/*">` should be
 * treated as an image.
 *
 * Deliberately permissive about a *missing* MIME type. iOS hands the browser a
 * File with an empty `type` in several common paths (notably HEIC/HEIF photos
 * straight from the camera roll, and files routed through the Files app), so a
 * strict `file.type.startsWith("image/")` check rejected real photos with
 * "Please choose an image file" — the picker had already restricted the
 * selection to images, so there was nothing the person could do about it.
 *
 * Anything that slips through is still validated server-side by UploadThing's
 * `image` file-type rule, so the cost of being lenient here is only a clearer
 * error arriving a moment later.
 */
export function isSelectableImage(file: File) {
  return file.type === "" || file.type.startsWith("image/");
}
