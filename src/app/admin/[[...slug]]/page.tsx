"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type Product = {
  id: number;
  title: string;
  slug: string;
  category: string | null;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

type ProductForm = {
  title: string;
  slug: string;
  category: string;
  short_description: string;
  description: string;
  image_url: string;
  featured: boolean;
  is_active: boolean;
  display_order: number;
};

type UploadResponse = {
  success?: boolean;
  url?: string;
  image_url?: string;
  error?: string;
};

type ProductsResponse = {
  success?: boolean;
  products?: Product[];
  product?: Product;
  message?: string;
  error?: string;
};

const emptyForm: ProductForm = {
  title: "",
  slug: "",
  category: "",
  short_description: "",
  description: "",
  image_url: "",
  featured: false,
  is_active: true,
  display_order: 0,
};

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readJsonResponse<T>(
  response: Response
): Promise<T> {
  const responseText = await response.text();

  if (!responseText) {
    return {} as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(
      `The server returned an invalid response. HTTP status: ${response.status}`
    );
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] =
    useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [uploadingImage, setUploadingImage] =
    useState(false);
  const [savingProduct, setSavingProduct] =
    useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/admin/products",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await readJsonResponse<ProductsResponse>(
          response
        );

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Products could not be loaded."
        );
      }

      setProducts(result.products || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Products could not be loaded."
      );
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function updateForm<K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K]
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function handleTitleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const title = event.target.value;

    setForm((currentForm) => ({
      ...currentForm,
      title,
      slug:
        editingId === null || !currentForm.slug
          ? createSlug(title)
          : currentForm.slug,
    }));
  }

  async function uploadProductImage(
    file: File
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result =
      await readJsonResponse<UploadResponse>(response);

    if (!response.ok || !result.success) {
      throw new Error(
        result.error || "The image upload failed."
      );
    }

    const uploadedUrl =
      result.image_url || result.url;

    if (!uploadedUrl) {
      throw new Error(
        "The image uploaded, but the server did not return an image URL."
      );
    }

    return uploadedUrl;
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setUploadingImage(true);
    setMessage("");
    setErrorMessage("");

    try {
      const uploadedImageUrl =
        await uploadProductImage(selectedFile);

      setForm((currentForm) => ({
        ...currentForm,
        image_url: uploadedImageUrl,
      }));

      setMessage(
        "Image uploaded successfully. Click Save Product to store the URL with the product."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The image could not be uploaded."
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSavingProduct(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!form.title.trim()) {
        throw new Error("Enter the product title.");
      }

      if (!form.image_url.trim()) {
        throw new Error(
          "Upload a product image before saving."
        );
      }

      const response = await fetch(
        "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingId,
            title: form.title.trim(),
            slug:
              form.slug.trim() ||
              createSlug(form.title),
            category: form.category.trim(),
            short_description:
              form.short_description.trim(),
            description: form.description.trim(),
            image_url: form.image_url.trim(),
            featured: form.featured,
            is_active: form.is_active,
            display_order: Number(
              form.display_order || 0
            ),
          }),
        }
      );

      const result =
        await readJsonResponse<ProductsResponse>(
          response
        );

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "The product could not be saved."
        );
      }

      setMessage(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      setEditingId(null);
      setForm(emptyForm);

      await loadProducts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The product could not be saved."
      );
    } finally {
      setSavingProduct(false);
    }
  }

  function editProduct(product: Product) {
    setEditingId(product.id);

    setForm({
      title: product.title || "",
      slug: product.slug || "",
      category: product.category || "",
      short_description:
        product.short_description || "",
      description: product.description || "",
      image_url: product.image_url || "",
      featured: Boolean(product.featured),
      is_active: product.is_active !== false,
      display_order: Number(
        product.display_order || 0
      ),
    });

    setMessage("");
    setErrorMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setErrorMessage("");
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Delete "${product.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/admin/products",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: product.id,
          }),
        }
      );

      const result =
        await readJsonResponse<ProductsResponse>(
          response
        );

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "The product could not be deleted."
        );
      }

      setMessage("Product deleted successfully.");

      if (editingId === product.id) {
        cancelEditing();
      }

      await loadProducts();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The product could not be deleted."
      );
    }
  }

  return (
    <main className="admin-products-page">
      <div className="admin-products-heading">
        <div>
          <span className="admin-products-eyebrow">
            Website Content
          </span>

          <h1>Products</h1>

          <p>
            Add products, upload their images and control
            which products appear on the public website.
          </p>
        </div>
      </div>

      {message && (
        <div className="admin-products-message success">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="admin-products-message error">
          {errorMessage}
        </div>
      )}

      <section className="admin-products-card">
        <div className="admin-products-card-heading">
          <div>
            <h2>
              {editingId
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <p>
              Upload the image before clicking Save
              Product.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="admin-products-secondary-button"
              onClick={cancelEditing}
            >
              <X size={17} />
              Cancel Editing
            </button>
          )}
        </div>

        <form
          className="admin-products-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-products-form-grid">
            <label className="admin-products-field">
              <span>Product Title *</span>

              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="Example: Aluminium Sliding Door"
                required
              />
            </label>

            <label className="admin-products-field">
              <span>Slug</span>

              <input
                type="text"
                value={form.slug}
                onChange={(event) =>
                  updateForm(
                    "slug",
                    createSlug(event.target.value)
                  )
                }
                placeholder="aluminium-sliding-door"
              />
            </label>

            <label className="admin-products-field">
              <span>Category</span>

              <input
                type="text"
                value={form.category}
                onChange={(event) =>
                  updateForm(
                    "category",
                    event.target.value
                  )
                }
                placeholder="Example: Aluminium Doors"
              />
            </label>

            <label className="admin-products-field">
              <span>Display Order</span>

              <input
                type="number"
                min="0"
                value={form.display_order}
                onChange={(event) =>
                  updateForm(
                    "display_order",
                    Number(event.target.value)
                  )
                }
              />
            </label>
          </div>

          <label className="admin-products-field">
            <span>Short Description</span>

            <textarea
              rows={3}
              value={form.short_description}
              onChange={(event) =>
                updateForm(
                  "short_description",
                  event.target.value
                )
              }
              placeholder="A brief summary displayed on product cards."
            />
          </label>

          <label className="admin-products-field">
            <span>Full Description</span>

            <textarea
              rows={6}
              value={form.description}
              onChange={(event) =>
                updateForm(
                  "description",
                  event.target.value
                )
              }
              placeholder="Describe the product, materials, features and applications."
            />
          </label>

          <div className="admin-products-upload-section">
            <div className="admin-products-upload-column">
              <span className="admin-products-upload-title">
                Product Image *
              </span>

              <label className="admin-products-upload-box">
                {uploadingImage ? (
                  <>
                    <Loader2
                      className="admin-products-spinner"
                      size={33}
                    />
                    <strong>Uploading image...</strong>
                  </>
                ) : (
                  <>
                    <Upload size={33} />
                    <strong>
                      Click to select an image
                    </strong>
                    <small>
                      JPG, PNG, WEBP or GIF, maximum
                      10 MB
                    </small>
                  </>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={uploadingImage}
                  hidden
                />
              </label>

              <label className="admin-products-field">
                <span>Image URL</span>

                <input
                  type="url"
                  value={form.image_url}
                  onChange={(event) =>
                    updateForm(
                      "image_url",
                      event.target.value
                    )
                  }
                  placeholder="The uploaded image URL appears here"
                />
              </label>
            </div>

            <div className="admin-products-image-preview">
              {form.image_url ? (
                <>
                  <img
                    src={form.image_url}
                    alt="Product preview"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      updateForm("image_url", "")
                    }
                  >
                    <Trash2 size={16} />
                    Remove Image
                  </button>
                </>
              ) : (
                <div className="admin-products-no-image">
                  <ImageIcon size={42} />
                  <p>No image uploaded</p>
                </div>
              )}
            </div>
          </div>

          <div className="admin-products-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  updateForm(
                    "featured",
                    event.target.checked
                  )
                }
              />
              Featured product
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  updateForm(
                    "is_active",
                    event.target.checked
                  )
                }
              />
              Published and visible
            </label>
          </div>

          <button
            type="submit"
            className="admin-products-save-button"
            disabled={
              savingProduct || uploadingImage
            }
          >
            {savingProduct ? (
              <>
                <Loader2
                  className="admin-products-spinner"
                  size={19}
                />
                Saving...
              </>
            ) : editingId ? (
              <>
                <Save size={19} />
                Update Product
              </>
            ) : (
              <>
                <Plus size={19} />
                Save Product
              </>
            )}
          </button>
        </form>
      </section>

      <section className="admin-products-card">
        <div className="admin-products-card-heading">
          <div>
            <h2>Existing Products</h2>

            <p>
              {products.length} product
              {products.length === 1 ? "" : "s"} found.
            </p>
          </div>
        </div>

        {loadingProducts ? (
          <div className="admin-products-loading">
            <Loader2
              className="admin-products-spinner"
              size={30}
            />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="admin-products-empty">
            <ImageIcon size={42} />
            <h3>No products found</h3>
            <p>Add the first product using the form.</p>
          </div>
        ) : (
          <div className="admin-products-list">
            {products.map((product) => (
              <article
                key={product.id}
                className="admin-products-item"
              >
                <div className="admin-products-item-image">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                    />
                  ) : (
                    <ImageIcon size={32} />
                  )}
                </div>

                <div className="admin-products-item-content">
                  <div className="admin-products-item-heading">
                    <h3>{product.title}</h3>

                    <div className="admin-products-badges">
                      {product.featured && (
                        <span className="featured">
                          Featured
                        </span>
                      )}

                      <span
                        className={
                          product.is_active
                            ? "published"
                            : "draft"
                        }
                      >
                        {product.is_active
                          ? "Published"
                          : "Hidden"}
                      </span>
                    </div>
                  </div>

                  {product.category && (
                    <strong>{product.category}</strong>
                  )}

                  {product.short_description && (
                    <p>
                      {product.short_description}
                    </p>
                  )}

                  <small>
                    Image URL:{" "}
                    {product.image_url
                      ? product.image_url
                      : "No image"}
                  </small>
                </div>

                <div className="admin-products-item-actions">
                  <button
                    type="button"
                    className="edit"
                    onClick={() =>
                      editProduct(product)
                    }
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete"
                    onClick={() =>
                      void deleteProduct(product)
                    }
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}