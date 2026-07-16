'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  Pencil,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

const imageFields = new Set(['image_url', 'logo_url']);
const fileFields = new Set(['file_url']);

function label(field: string) {
  return field
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

async function readJsonSafe(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function AdminCMS({
  module,
  title,
  fields,
}: {
  module: string;
  title: string;
  fields: string[];
}) {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState('');
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  async function load() {
    setLoading(true);

    try {
      const response = await fetch(`/api/content/${module}`, {
        cache: 'no-store',
      });
      const data = await readJsonSafe(response);

      if (!response.ok) {
        setItems([]);
        setMessage(data?.error || `Unable to load ${title}.`);
        return;
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setItems([]);
      setMessage('Unable to connect to the content service. Check the terminal for details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [module]);

  useEffect(() => {
    if (editing) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editing]);

  async function upload(
    files: FileList | null,
    field: string,
    multiple = false,
  ) {
    if (!files?.length) return;

    setUploading(field);
    setMessage('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await readJsonSafe(response);

      if (!response.ok) {
        setMessage(data?.error || 'Upload failed.');
        return;
      }

      const urls = Array.isArray(data?.urls) ? data.urls : [];

      if (!urls.length) {
        setMessage('No supported file was uploaded. Use JPG, PNG, WEBP, GIF or PDF files below 10 MB.');
        return;
      }

      const input = formRef.current?.elements.namedItem(field) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;

      if (input) {
        if (multiple) {
          const existing = input.value.trim();
          input.value = [existing, ...urls].filter(Boolean).join('\n');
        } else {
          input.value = urls[0] || '';
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      setMessage('File uploaded successfully. Click Save Content to publish it.');
    } catch (error) {
      console.error(error);
      setMessage('The upload failed. Check your connection and try again.');
    } finally {
      setUploading('');
    }
  }

  async function removeFile(url: string, field: string) {
    if (!url || !confirm('Delete this file permanently from Vercel Blob?')) return;

    try {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await readJsonSafe(response);

      if (!response.ok) {
        setMessage(data?.error || 'Unable to delete the file.');
        return;
      }

      const input = formRef.current?.elements.namedItem(field) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;

      if (input) input.value = '';

      setEditing((current: any) =>
        current ? { ...current, [field]: '' } : current,
      );
      setMessage('Old file deleted. Select a replacement and save the content.');
    } catch (error) {
      console.error(error);
      setMessage('Unable to delete the file.');
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const form = event.currentTarget;
    const body: Record<string, FormDataEntryValue | boolean> = Object.fromEntries(
      new FormData(form),
    );

    for (const field of fields.filter((item) => item.startsWith('is_'))) {
      const checkbox = form.elements.namedItem(field) as HTMLInputElement | null;
      body[field] = Boolean(checkbox?.checked);
    }

    const url = `/api/content/${module}${editing ? `/${editing.id}` : ''}`;

    try {
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await readJsonSafe(response);

      if (!response.ok) {
        setMessage(data?.error || 'Unable to save the content.');
        return;
      }

      setMessage('Saved successfully. The website content has been updated.');
      setEditing(null);
      form.reset();
      await load();
    } catch (error) {
      console.error(error);
      setMessage('Unable to save the content. Check the terminal for details.');
    }
  }

  async function deleteItem(item: any) {
    if (!confirm('Delete this content permanently?')) return;

    try {
      for (const field of ['image_url', 'logo_url', 'file_url']) {
        if (item[field]?.startsWith('https://')) {
          await fetch('/api/files/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item[field] }),
          });
        }
      }

      if (item.gallery_urls) {
        const galleryUrls = String(item.gallery_urls)
          .split(/\r?\n|,/)
          .map((url) => url.trim())
          .filter((url) => url.startsWith('https://'));

        for (const url of galleryUrls) {
          await fetch('/api/files/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
        }
      }

      const response = await fetch(`/api/content/${module}/${item.id}`, {
        method: 'DELETE',
      });
      const data = await readJsonSafe(response);

      if (!response.ok) {
        setMessage(data?.error || 'Unable to delete the content.');
        return;
      }

      setMessage('Content deleted successfully.');
      await load();
    } catch (error) {
      console.error(error);
      setMessage('Unable to delete the content.');
    }
  }

  const titleField = useMemo(
    () =>
      fields.find((field) =>
        ['title', 'name', 'question', 'client_name'].includes(field),
      ) || fields[0],
    [fields],
  );

  return (
    <div className="cms-page">
      <div className="cms-heading">
        <div>
          <div className="eyebrow">Content Management</div>
          <h1>{title}</h1>
          <p>
            Add, update, hide or remove website content. Uploaded files are
            stored securely in <b>Vercel Blob</b> under the online images folder.
          </p>
        </div>
      </div>

      {message && (
        <div className="cms-message">
          <CheckCircle2 size={19} />
          {message}
          <button type="button" onClick={() => setMessage('')}>
            <X size={17} />
          </button>
        </div>
      )}

      <div className="cms-layout">
        <form
          key={editing?.id || 'new'}
          ref={formRef}
          className="admin-card form cms-form"
          onSubmit={save}
        >
          <div className="cms-form-title">
            <h3>{editing ? 'Edit content' : 'Add new content'}</h3>

            {editing && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setEditing(null);
                  formRef.current?.reset();
                }}
              >
                <X />
              </button>
            )}
          </div>

          {fields.map((field) => {
            if (field.startsWith('is_')) {
              return (
                <label className="switch-row" key={field}>
                  <input
                    type="checkbox"
                    name={field}
                    defaultChecked={editing?.[field] ?? true}
                  />
                  <span>{label(field)}</span>
                </label>
              );
            }

            if (imageFields.has(field) || fileFields.has(field)) {
              const current = editing?.[field] || '';

              return (
                <div className="upload-field" key={field}>
                  <label>{label(field)}</label>
                  <input
                    className="input"
                    name={field}
                    defaultValue={current}
                    placeholder="Upload a file or paste its URL"
                  />

                  <div className="upload-actions">
                    <label className="upload-button">
                      <UploadCloud size={18} />
                      {uploading === field ? 'Uploading...' : 'Choose File'}
                      <input
                        type="file"
                        accept={
                          fileFields.has(field)
                            ? '.pdf,.doc,.docx,image/*'
                            : 'image/*'
                        }
                        hidden
                        onChange={(event) =>
                          upload(event.target.files, field)
                        }
                      />
                    </label>

                    {current && (
                      <button
                        type="button"
                        className="delete-file"
                        onClick={() => removeFile(current, field)}
                      >
                        <Trash2 size={17} />
                        Delete old file
                      </button>
                    )}
                  </div>

                  {current && imageFields.has(field) && (
                    <img
                      className="upload-preview"
                      src={current}
                      alt="Current upload"
                    />
                  )}
                </div>
              );
            }

            if (field === 'gallery_urls') {
              return (
                <div className="upload-field" key={field}>
                  <label>Additional Images</label>
                  <textarea
                    name={field}
                    defaultValue={editing?.[field] || ''}
                    placeholder="One image URL per line"
                  />

                  <label className="upload-button">
                    <ImagePlus size={18} />
                    {uploading === field
                      ? 'Uploading...'
                      : 'Choose Multiple Pictures'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(event) =>
                        upload(event.target.files, field, true)
                      }
                    />
                  </label>
                </div>
              );
            }

            if (
              field.includes('description') ||
              [
                'body',
                'quote',
                'requirements',
                'answer',
                'features',
                'summary',
                'excerpt',
              ].includes(field)
            ) {
              return (
                <div className="field" key={field}>
                  <label>{label(field)}</label>
                  <textarea
                    name={field}
                    defaultValue={editing?.[field] || ''}
                    placeholder={label(field)}
                  />
                </div>
              );
            }

            return (
              <div className="field" key={field}>
                <label>{label(field)}</label>
                <input
                  className="input"
                  name={field}
                  type={
                    field.includes('date') ||
                    field === 'deadline' ||
                    field === 'published_at'
                      ? 'date'
                      : 'text'
                  }
                  defaultValue={editing?.[field] ?? ''}
                  placeholder={label(field)}
                />
              </div>
            );
          })}

          <div className="form-actions">
            <button className="btn btn-red" type="submit">
              {editing ? 'Update Content' : 'Save Content'}
            </button>

            {editing && (
              <button
                type="button"
                className="btn btn-light"
                onClick={() => {
                  setEditing(null);
                  formRef.current?.reset();
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="content-list">
          <div className="content-list-head">
            <div>
              <h2>Published Content</h2>
              <p>
                {items.length} item{items.length === 1 ? '' : 's'} in this
                section
              </p>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <h3>Loading content...</h3>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <ImagePlus size={45} />
              <h3>No content yet</h3>
              <p>Use the form to add the first item.</p>
            </div>
          ) : (
            <div className="content-grid">
              {items.map((item) => (
                <article className="content-admin-card" key={item.id}>
                  {(item.image_url || item.logo_url) && (
                    <div className="content-thumb">
                      <img
                        src={item.image_url || item.logo_url}
                        alt={item[titleField] || 'Content image'}
                      />
                    </div>
                  )}

                  <div className="content-admin-body">
                    <span
                      className={`status ${
                        item.is_active === false ? 'hidden' : 'active'
                      }`}
                    >
                      {item.is_active === false ? 'Hidden' : 'Active'}
                    </span>

                    <h3>{item[titleField] || 'Untitled item'}</h3>
                    <p>
                      {item.summary ||
                        item.excerpt ||
                        item.description ||
                        item.category ||
                        item.location ||
                        item.email ||
                        'Website content item'}
                    </p>

                    <div className="content-actions">
                      <button type="button" onClick={() => setEditing(item)}>
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteItem(item)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
