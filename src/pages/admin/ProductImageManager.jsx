import { useRef } from "react";
import { MAX_PRODUCT_IMAGES, revokeImagePreviews } from "./productImages";

export default function ProductImageManager({ images, onChange, validateFiles, onError }) {
  const inputRef = useRef(null);
  const slotsLeft = MAX_PRODUCT_IMAGES - images.length;

  const addFiles = fileList => {
    const files = Array.from(fileList || []);
    const { validFiles, errors } = validateFiles(files);
    const accepted = validFiles.slice(0, slotsLeft);
    if (validFiles.length > accepted.length) {
      errors.push(`A product can have at most ${MAX_PRODUCT_IMAGES} images.`);
    }
    if (errors.length) onError(errors.join("\n"));
    if (accepted.length) {
      onChange([
        ...images,
        ...accepted.map(file => ({
          kind: "new",
          file,
          previewUrl: URL.createObjectURL(file)
        }))
      ]);
    }
    if (inputRef.current) inputRef.current.value = ""; // allow picking the same file again
  };

  const move = (from, to) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const remove = index => {
    revokeImagePreviews([images[index]]);
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="pim">
      {images.length > 0 && (
        <ol className="pim-grid">
          {images.map((img, i) => (
            <li
              key={img.kind === "new" ? img.previewUrl : `id-${img.id}`}
              className={`pim-tile ${i === 0 ? "is-main" : ""}`}
            >
              <img src={img.kind === "new" ? img.previewUrl : img.url} alt={`Product image ${i + 1}`} />
              {i === 0 && <span className="pim-badge pim-badge-main">Main</span>}
              {img.kind === "new" && <span className="pim-badge pim-badge-new">New</span>}
              <button
                type="button"
                className="pim-remove"
                onClick={() => remove(i)}
                aria-label={`Remove image ${i + 1}`}
                title="Remove image"
              >
                ×
              </button>
              <div className="pim-controls">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Move image ${i + 1} left`}
                  title="Move left"
                >
                  ←
                </button>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => move(i, 0)}
                    aria-label={`Make image ${i + 1} the main image`}
                    title="Make main image"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === images.length - 1}
                  aria-label={`Move image ${i + 1} right`}
                  title="Move right"
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {slotsLeft > 0 && (
        <label className="pim-add">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={e => addFiles(e.target.files)}
          />
          <span>+ Add images</span>
        </label>
      )}
      <small className="pim-hint">
        {images.length}/{MAX_PRODUCT_IMAGES} images · jpg, png, gif or webp. The first image is
        the main image shown on product cards. Use ← → or ★ to change the order.
      </small>
    </div>
  );
}
