"use client";

import { useMemo, useState } from "react";
import { X, ZoomIn } from "lucide-react";

type GalleryImage = {
  id: number;
  title: string | null;
  description: string | null;
  caption: string | null;
  album: string | null;
  category: string | null;
  image_url: string;
};

export default function GalleryClient({
  images,
}: {
  images: GalleryImage[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const categories = useMemo(() => {
    const values = images
      .map((image) => image.album || image.category)
      .filter((value): value is string => Boolean(value));

    return ["All", ...Array.from(new Set(values))];
  }, [images]);

  const filteredImages = useMemo(() => {
    if (selectedCategory === "All") {
      return images;
    }

    return images.filter(
      (image) =>
        image.album === selectedCategory ||
        image.category === selectedCategory
    );
  }, [images, selectedCategory]);

  return (
    <>
      {categories.length > 1 && (
        <div className="gallery-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={selectedCategory === category ? "active" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="gallery-grid">
        {filteredImages.map((image) => (
          <button
            key={image.id}
            type="button"
            className="gallery-card"
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image.image_url}
              alt={
                image.title ||
                image.caption ||
                "Postcorp gallery installation"
              }
            />

            <div className="gallery-card-overlay">
              <ZoomIn size={26} />

              <div>
                <h3>{image.title || "Postcorp Project"}</h3>

                {(image.caption || image.description) && (
                  <p>{image.caption || image.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedImage && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="gallery-lightbox-close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            <X size={28} />
          </button>

          <div
            className="gallery-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedImage.image_url}
              alt={
                selectedImage.title ||
                selectedImage.caption ||
                "Postcorp gallery image"
              }
            />

            <div className="gallery-lightbox-caption">
              <h3>{selectedImage.title || "Postcorp Project"}</h3>

              {(selectedImage.caption || selectedImage.description) && (
                <p>
                  {selectedImage.caption || selectedImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}