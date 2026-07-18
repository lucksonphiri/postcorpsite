import Link from "next/link";
import Chatbot from "./Chatbot";
import MobileNav from "./MobileNav";

type SocialName = "Facebook" | "Instagram" | "TikTok" | "WhatsApp";

const social: { name: SocialName; url: string }[] = [
  {
    name: "Facebook",
    url: "https://www.facebook.com/share/1EEtJ9at6K/?mibextid=wwXIfr",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/postcorpglassandaluminium",
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@postcorpglassalum",
  },
  {
    name: "WhatsApp",
    url: "https://whatsapp.com/channel/0029Vb855lMIHphCdzAfMS2N",
  },
];

function SocialIcon({ name }: { name: SocialName }) {
  if (name === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.2 8.1h2.4V4.5c-.4-.1-1.8-.2-3.4-.2-3.4 0-5.7 2.1-5.7 5.9v3.3H4v4h3.5V24h4.3v-6.5h3.6l.6-4h-4.2v-2.9c0-1.2.3-2.5 2.4-2.5Z" />
      </svg>
    );
  }

  if (name === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 2A3.2 3.2 0 0 0 4 7.2v9.6A3.2 3.2 0 0 0 7.2 20h9.6a3.2 3.2 0 0 0 3.2-3.2V7.2A3.2 3.2 0 0 0 16.8 4H7.2Zm10.1 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    );
  }

  if (name === "TikTok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16.6 2c.4 2.2 1.7 3.5 3.9 3.7v3.4a8.4 8.4 0 0 1-3.9-1.2v7.3a6.8 6.8 0 1 1-5.9-6.7v3.5a3.4 3.4 0 1 0 2.5 3.2V2h3.4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a9.7 9.7 0 0 0-8.3 14.7L2.4 22l5.4-1.3A9.8 9.8 0 1 0 12 2Zm0 17.6a7.6 7.6 0 0 1-3.9-1l-.3-.2-3.2.8.9-3.1-.2-.3A7.7 7.7 0 1 1 12 19.6Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a6.2 6.2 0 0 1-3.1-2.7c-.2-.3 0-.5.1-.6l.4-.5.2-.5c.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.5 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.2-.6-.3Z" />
    </svg>
  );
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="top-contacts">
            <a href="tel:+263772957823"><b>Harare:</b> +263 77 295 7823</a>
            <a href="tel:+263771529898"><b>Masvingo:</b> +263 77 152 9898</a>
            <a href="tel:+263787222324"><b>Bulawayo:</b> +263 78 722 2324</a>
          </div>

          <div className="top-social" aria-label="Postcorp social media">
            {social.map(({ name, url }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={name}
                aria-label={`Open ${name}`}
              >
                <span className="social-icon"><SocialIcon name={name} /></span>
                <span className="social-label">{name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <header className="nav">
        <div className="container nav-inner">
          <Link href="/">
            <img className="logo" src="/images/logo.png" alt="Postcorp" />
          </Link>

          <nav className="navlinks">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/services">Services</Link>
            <Link href="/products">Products</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/news">News</Link>
            <Link href="/contact">Contact</Link>
            <Link className="nav-quote" href="/quote">Request a Quote</Link>
          </nav>

          <MobileNav />
        </div>
      </header>

      {children}

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <img className="footer-logo" src="/images/logo.png" alt="Postcorp" />
              <p>
                Guaranteed quality at best price and the best advice.
                Professional glass, aluminium and shopfitting solutions.
              </p>
            </div>

            <div>
              <h4>Company</h4>
              <p><Link href="/about">About Us</Link></p>
              <p><Link href="/projects">Projects</Link></p>
              <p><Link href="/careers">Careers</Link></p>
            </div>

            <div>
              <h4>Solutions</h4>
              <p><Link href="/services">Services</Link></p>
              <p><Link href="/products">Products</Link></p>
              <p><Link href="/quote">Request a Quote</Link></p>
            </div>

            <div>
              <h4>Follow Us</h4>
              <div className="footer-social">
                {social.map(({ name, url }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={name}
                    aria-label={`Open ${name}`}
                  >
                    <span className="social-icon"><SocialIcon name={name} /></span>
                    <span>{name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            © {new Date().getFullYear()} Postcorp Glass &amp; Aluminium.
          </div>
        </div>
      </footer>

      <Chatbot />
    </>
  );
}
