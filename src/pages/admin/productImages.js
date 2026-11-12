import { IMAGE_BASE_URL } from "../../api/api";

export const MAX_PRODUCT_IMAGES = 10;

/*
 * Image list item shapes:
 *   { kind: "existing", id, url }        – already saved on the product
 *   { kind: "new", file, previewUrl }    – picked in this form, not uploaded yet
 * The first item is the product's main image.
 */

const toFullUrl = url => (url?.startsWith("/") ? IMAGE_BASE_URL + url : url);

export const existingImagesOf = product =>
  (product?.images || []).map(img => ({
    kind: "existing",
    id: img.id,
    url: toFullUrl(img.imageUrl)
  }));

export const revokeImagePreviews = images =>
  images.forEach(img => img.kind === "new" && URL.revokeObjectURL(img.previewUrl));

// Adds the images to FormData: files as "images", plus "imageOrder" when editing.
export const appendImagesToFormData = (formData, images, isEditing) => {
  const order = [];
  let newIndex = 0;
  images.forEach(img => {
    if (img.kind === "new") {
      formData.append("images", img.file);
      order.push(`new-${newIndex++}`);
    } else {
      order.push(img.id);
    }
  });
  if (isEditing) formData.append("imageOrder", JSON.stringify(order));
};
