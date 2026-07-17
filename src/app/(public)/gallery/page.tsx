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
      <section
        className="page-hero"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,35,40,.72), rgba(30,35,40,.72)), url('/images/gallery-hero.jpg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="container">
          <div className="eyebrow">Our Work</div>
          <h1>Gallery</h1>
          <p>
            Explore selected aluminium, glass and shopfitting installations
            completed by Postcorp.
          </p>
        </div>
      </section>

      <section className="section section-grey">
        <div className="container">
          {images.length > 0 ? (
            <GalleryClient images={images} />
          ) : (
            <div className="admin-card">
              <h2>No gallery images published yet</h2>
              <p>
                Add an image from Administration → Gallery and ensure its status
                is Published.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}