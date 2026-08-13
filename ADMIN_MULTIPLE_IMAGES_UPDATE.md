# Admin Multiple Product Images - Implementation Guide

## Overview
Updated the admin product creation/editing to support uploading multiple product images. Images are stored on the backend server and returned as an array in the API response.

## Files Modified

### 1. **src/pages/admin/AdminProducts.jsx**

#### Changes Made:

**a) Updated EMPTY_FORM constant:**
- Added `imageFiles: []` to store selected image files

```javascript
const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  pricingType: "fixed",
  weightValue: "",
  weightUnit: "g",
  stock: "",
  categoryId: "",
  imageUrl: "",
  imageFiles: [] // NEW: Multiple image files
};
```

**b) Added file input reference:**
```javascript
const fileInputRef = useRef(null); // For file input control
```

**c) Updated handleSubmit function:**
- Changed from sending JSON payload to FormData
- Now appends multiple files with `formData.append("images", file)`
- Handles both main imageUrl and multiple image files

```javascript
// Use FormData for multipart file upload
const formData = new FormData();
formData.append("name", productForm.name.trim());
formData.append("description", productForm.description.trim());
formData.append("price", Number(productForm.price));
formData.append("priceUnit", priceUnit);
formData.append("stock", Number(productForm.stock));
formData.append("categoryId", Number(productForm.categoryId));

// Add main imageUrl if provided
if (productForm.imageUrl.trim()) {
  formData.append("imageUrl", productForm.imageUrl.trim());
}

// Add multiple image files
if (productForm.imageFiles && productForm.imageFiles.length > 0) {
  productForm.imageFiles.forEach(file => {
    formData.append("images", file);
  });
}

const response = await saveProduct(formData, editingId);
```

**d) Updated startEdit function:**
- Clears imageFiles array when editing existing product
- Allows adding new images when editing

```javascript
imageFiles: [] // Clear file selection when editing
```

**e) Replaced image input field with comprehensive image upload section:**
- Main image URL field (optional, for backward compatibility)
- Multiple file input with `accept="image/*"` and `multiple` attributes
- Live thumbnail previews of selected files
- Remove button for each selected image

```javascript
<input
  id="p-images"
  type="file"
  multiple
  accept="image/*"
  ref={fileInputRef}
  onChange={e => {
    const files = Array.from(e.target.files || []);
    setProductForm(p => ({ ...p, imageFiles: files }));
  }}
/>

// Thumbnail preview section for selected files
{productForm.imageFiles && productForm.imageFiles.length > 0 && (
  <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
    {productForm.imageFiles.map((file, idx) => (
      <div key={idx} style={{ position: "relative", width: "80px", height: "80px" }}>
        <img
          src={URL.createObjectURL(file)}
          alt={`preview-${idx}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <button
          type="button"
          onClick={() => {
            const updated = productForm.imageFiles.filter((_, i) => i !== idx);
            setProductForm(p => ({ ...p, imageFiles: updated }));
          }}
          style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            background: "#ef4444",
            color: "white",
            border: "none",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            cursor: "pointer"
          }}
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}
```

**f) Updated product detail expansion:**
- Now displays all images in the images array
- Shows thumbnail gallery of uploaded product images
- Each image links to the actual URL (opens in new tab)

```javascript
{product.images && product.images.length > 0 && (
  <div style={{ marginTop: 12 }}>
    <strong>Product Images ({product.images.length}):</strong>
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
      {product.images.map((img, idx) => (
        <a
          key={idx}
          href={img.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ width: "60px", height: "60px", borderRadius: "6px", overflow: "hidden" }}
        >
          <img
            src={img.imageUrl}
            alt={`Image ${idx + 1}`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </a>
      ))}
    </div>
  </div>
)}
```

### 2. **src/pages/admin/adminShared.js**

#### Changes Made:

**Updated saveProduct function:**
- Detects if payload is FormData instance
- Passes FormData to API endpoints
- Axios automatically handles Content-Type and boundary for FormData

```javascript
export const saveProduct = async (payload, editingProductId) => {
  // Check if payload is FormData (for multipart file uploads)
  const isFormData = payload instanceof FormData;
  
  // Axios will automatically handle Content-Type for FormData
  // Don't explicitly set it to let axios set the boundary
  const config = isFormData ? {} : {};

  if (editingProductId) {
    const res = await API.put(`/admin/products/${editingProductId}`, payload, config);
    return res?.data;
  }
  const res = await API.post("/products", payload, config);
  return res?.data;
};
```

## API Request/Response Format

### Create Product Request
**Endpoint**: `POST /api/products`

```
Content-Type: multipart/form-data
```

**Form Data:**
```
name: "Organic Rice"
description: "Premium basmati rice"
price: 450
priceUnit: "fixed"
stock: 100
categoryId: 2
imageUrl: "" (optional)
images: [File, File, File]
```

### API Response
**Status**: 201 Created

```json
{
  "id": 1,
  "name": "Organic Rice",
  "description": "Premium basmati rice",
  "price": 450,
  "priceUnit": "fixed",
  "stock": 100,
  "imageUrl": "/uploads/rice-main-1728554400000-123456789.jpg",
  "categoryId": 2,
  "createdAt": "2026-08-10T10:15:30.000Z",
  "images": [
    {
      "id": 1,
      "productId": 1,
      "imageUrl": "/uploads/rice-1-1728554400000-123456789.jpg",
      "createdAt": "2026-08-10T10:15:30.000Z"
    },
    {
      "id": 2,
      "productId": 1,
      "imageUrl": "/uploads/rice-2-1728554401000-987654321.jpg",
      "createdAt": "2026-08-10T10:15:31.000Z"
    },
    {
      "id": 3,
      "productId": 1,
      "imageUrl": "/uploads/rice-3-1728554402000-456789123.jpg",
      "createdAt": "2026-08-10T10:15:32.000Z"
    }
  ]
}
```

### Update Product Request
**Endpoint**: `PUT /api/admin/products/:id`

```
Content-Type: multipart/form-data
```

**Form Data:**
```
name: "Organic Rice"
description: "Premium basmati rice"
price: 450
priceUnit: "fixed"
stock: 100
categoryId: 2
imageUrl: "" (optional)
images: [File, File] (optional - only new images to add)
```

**Note**: When updating, only new files added will be uploaded. Existing images are not deleted unless the backend implements a deletion mechanism.

## Frontend Workflow

### 1. **Create Product with Multiple Images**
```
1. Admin clicks "+ Add Product"
2. Fills in product details (name, price, category, etc.)
3. Selects one or more images using file input
4. Sees live thumbnail previews of selected images
5. Can remove individual images by clicking the × button
6. Clicks "Create Product"
7. FormData is sent to backend with all files
8. Response includes images array with imageUrl for each
9. Success message shown and form clears
```

### 2. **Edit Product and Add New Images**
```
1. Admin clicks "Edit" on a product
2. Form is pre-filled with existing data
3. imageFiles array is empty (no pre-selected files)
4. Admin can select additional images to upload
5. Selected new images show thumbnails
6. Clicking "Update Product" sends FormData with new files
7. Backend adds new images to existing ones
8. Product detail view shows all images (old + new)
```

### 3. **View Product Images in Admin**
```
1. Admin table shows product with main image thumbnail
2. Clicking "▼ details" expands product row
3. Shows main image URL
4. Shows gallery of all images in images array
5. Each image thumbnail is clickable (opens in new tab)
6. Shows count: "Product Images (3)"
```

## Integration with ProductDetail.jsx

The ProductDetail.jsx component was already updated to handle the new image format:

```javascript
const images = product?.images?.length
  ? product.images.map(img => img.imageUrl || img)
  : product?.imageUrl
    ? [product.imageUrl]
    : [];
```

This extracts `imageUrl` from each image object and:
- Displays thumbnails for multiple images
- Allows clicking thumbnails to switch main display image
- Falls back to main imageUrl if no images array exists

## Features

✅ **Multiple File Selection**
- Admin can select 1 or many images at once
- File input accepts all image formats

✅ **Live Preview**
- Selected files shown as 80×80px thumbnails
- Uses URL.createObjectURL for instant preview
- No backend calls needed for preview

✅ **Remove Before Upload**
- Each thumbnail has × button
- Clicking removes that file from selection
- No API calls made until form submission

✅ **FormData Submission**
- All fields sent as multipart/form-data
- Supports text fields and multiple files
- Axios handles Content-Type and boundary automatically

✅ **Admin Detail View**
- Expanded product row shows all images
- Displays image count
- Each image clickable to view full size

✅ **Backward Compatibility**
- Main imageUrl field still supported
- Works with products that have only imageUrl
- Products with images array take precedence

## Testing Checklist

- [ ] Create new product with 1 image
- [ ] Create new product with 3+ images
- [ ] See thumbnail previews while selecting files
- [ ] Remove images by clicking × before submission
- [ ] Submit product and see all images in response
- [ ] View expanded product detail in admin table
- [ ] See image thumbnails gallery in detail view
- [ ] Click image thumbnail to open in new tab
- [ ] Edit existing product and add new images
- [ ] View all images (old + new) in detail view
- [ ] Check product detail page shows thumbnails
- [ ] Click thumbnails on product page to switch main image

## Browser Compatibility

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Uses File API and FormData API (supported in IE10+)
- URL.createObjectURL for file preview (all modern browsers)

## Performance Considerations

- Thumbnail previews use URL.createObjectURL (memory efficient)
- No image compression done on frontend
- Backend should validate and optimize images
- Consider max file size limits on backend
- Consider max number of images per product
