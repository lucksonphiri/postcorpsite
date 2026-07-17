import GalleryClient from "@/components/GalleryClient";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type GalleryImage = {
  id: number;
  title: string | null;
  description: string | null;
  caption: string | null;
  album: string | null;
  category: string | null;
  image_url: string;
};

export default async function GalleryPage() {
  let images: GalleryImage[] = [];

  try {
    images = (await sql`
      SELECT
        id,
        title,
        description,
        caption,
        album,
        category,
        image_url
      FROM gallery_images
      WHERE
        image_url IS NOT NULL
        AND image_url <> ''
        AND COALESCE(is_active, true) = true
        AND LOWER(COALESCE(status, 'published')) = 'published'
      ORDER BY
        COALESCE(display_order, 0) ASC,
        id DESC
    `) as GalleryImage[];
  } catch (error) {
    console.error("Gallery loading error:", error);
  }

  return (
    <main>
      <section className="gallery-page-hero">
        <div
          className="gallery-page-hero-background"
          style={{
            backgroundImage: "url('/images/gallery-hero.jpg')",
          }}
        />

        <div className="gallery-page-hero-overlay" />

        <div className="gallery-page-hero-decoration" />

        <div className="container gallery-page-hero-content">
          <div className="gallery-page-hero-text">
            <span className="eyebrow">Our Portfolio</span>

            <h1>Gallery</h1>

            <p>
              Explore selected aluminium, glass, glazing and shopfitting
              projects completed by Postcorp across Zimbabwe. Every
              installation reflects our commitment to quality workmanship,
              innovation and customer satisfaction.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-grey">
        <div className="container">
          {images.length > 0 ? (
            <GalleryClient images={images} />
          ) : (
            <div className="gallery-empty-state">
              <h2>No gallery images published yet</h2>

              <p>
                Add images from Administration → Gallery and make sure the
                content status is set to Published.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}