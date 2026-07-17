import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import { ContentCards } from "@/components/Cards";
import {
  active,
  featured,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const slides = await active("slides", 10);
  const services = await featured("services", 6);
  const projects = await featured("projects", 6);

  const defaultServices = [
    {
      id: 1,
      title: "Design & Consultation",
      summary:
        "Professional consultation, site measurements and customised glass and aluminium designs.",
      image_url: "/images/pic01p.jpg",
    },
    {
      id: 2,
      title: "Fabrication & Installation",
      summary:
        "Precision fabrication and professional installation of glass and aluminium systems.",
      image_url: "/images/pic02p.jpg",
    },
    {
      id: 3,
      title: "Shopfitting & Interior Works",
      summary:
        "Shopfronts, office partitions, suspended ceilings, glazing and interior fit-outs.",
      image_url: "/images/pic03p.jpg",
    },
  ];

  const defaultProjects = [
    {
      id: 1,
      title: "Chinhoyi University Heights",
      location: "Chinhoyi",
      summary:
        "Aluminium windows, doors, louvres and partitions for 385 accommodation units.",
      image_url: "/images/pic01pr.jpg",
    },
    {
      id: 2,
      title: "Cork Corner Simbisa Mall",
      location: "Avondale",
      summary:
        "Shopfronts, suspended ceilings, balustrades and partitions.",
      image_url: "/images/pic02pr.jpg",
    },
    {
      id: 3,
      title: "Zimbabwe Military Academy",
      location: "Gweru",
      summary:
        "Windows, doors, shopfronts, glazing and maintenance.",
      image_url: "/images/pic03pr.jpg",
    },
  ];

  return (
    <main>
      <HeroSlider slides={slides as any[]} />

      <section className="section">
        <div className="container two-col">
          <div>
            <div className="eyebrow">
              Built on quality
            </div>

            <h2 className="section-title">
              From concept to flawless installation.
            </h2>

            <div className="redline" />

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.8,
                color: "#555",
              }}
            >
              Postcorp provides professional
              design, fabrication, installation,
              glazing, ceiling installation,
              shopfitting, partitioning,
              maintenance and project management
              services.
            </p>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.8,
                color: "#555",
              }}
            >
              We manufacture and supply aluminium
              doors, windows, shopfronts, shower
              cubicles, balustrades, skylights,
              louvres, mirrors and architectural
              glass products.
            </p>

            <Link
              className="btn btn-red"
              href="/about"
            >
              Discover Postcorp
            </Link>
          </div>

          <img
            style={{
              borderRadius: 12,
              width: "100%",
              minHeight: 420,
              objectFit: "cover",
            }}
            src="/images/pic01prj.jpg"
            alt="Completed Postcorp glass and aluminium project"
          />
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <div className="eyebrow">
            Our expertise
          </div>

          <h2 className="section-title">
            Professional services from design to
            installation.
          </h2>

          <ContentCards
            items={
              services.length
                ? services
                : defaultServices
            }
          />

          <div style={{ marginTop: 35 }}>
            <Link
              className="btn btn-red"
              href="/services"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-grey">
        <div className="container">
          <div className="stats">
            <div className="stat">
              <strong>20+</strong>
              Years of experience
            </div>

            <div className="stat">
              <strong>3</strong>
              Zimbabwe branches
            </div>

            <div className="stat">
              <strong>385</strong>
              Units at Varsity Heights
            </div>

            <div className="stat">
              <strong>370</strong>
              Units at Beitbridge
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="eyebrow">
            Selected projects
          </div>

          <h2 className="section-title">
            A legacy visible across Zimbabwe.
          </h2>

          <ContentCards
            items={
              projects.length
                ? projects
                : defaultProjects
            }
          />

          <div style={{ marginTop: 35 }}>
            <Link
              className="btn btn-red"
              href="/projects"
            >
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container two-col">
          <div>
            <div className="eyebrow">
              Ready to transform your space?
            </div>

            <h2 className="section-title">
              Tell us what you want to build.
            </h2>

            <p
              style={{
                color: "#e1e5e8",
                fontSize: 18,
                lineHeight: 1.7,
              }}
            >
              Share your measurements, drawings and
              project requirements. Our team will
              guide you towards a practical glass and
              aluminium solution.
            </p>
          </div>

          <div>
            <Link
              className="btn btn-red"
              href="/quote"
            >
              Request a Quotation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}