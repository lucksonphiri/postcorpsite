type Props = {
  title: string;
  eyebrow?: string;
  text?: string;
  image?: string;
};

const backgrounds: Record<string, string> = {
  "About Postcorp": "/images/pic04prj.jpg",
  Services: "/images/pic03prj.jpg",
  Products: "/images/pic02prj.jpg",
  Projects: "/images/slide03.jpg",
  "Project Gallery": "/images/slide05.jpg",
  "News & Insights": "/images/slide04.jpg",
  Careers: "/images/pic05.jpg",
  Downloads: "/images/pic06.jpg",
  "Request a Quote": "/images/slide02.jpg",
  "Contact Us": "/images/slide01.jpg",
};

export default function PageHero({
  title,
  eyebrow = "Postcorp Glass & Aluminium",
  text,
  image,
}: Props) {
  const backgroundImage = image || backgrounds[title] || "/images/bg.jpg";

  return (
    <section
      className="page-hero page-hero-image"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div className="page-hero-overlay" />
      <div className="container page-hero-content">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
        <div className="redline" />
      </div>
    </section>
  );
}
