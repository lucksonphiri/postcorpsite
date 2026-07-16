"use client";

import Link from "next/link";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact Us" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("postcorp-mobile-menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";

    if (open) {
      window.dispatchEvent(new CustomEvent("postcorp:mobile-menu-open"));
    }

    return () => {
      document.body.classList.remove("postcorp-mobile-menu-open");
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const closeForChat = () => setOpen(false);
    window.addEventListener("postcorp:chat-open", closeForChat);
    return () => window.removeEventListener("postcorp:chat-open", closeForChat);
  }, []);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 1020) setOpen(false);
    };
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <div className="mobile-navigation">
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="postcorp-mobile-menu"
      >
        <Menu size={26} />
      </button>

      <button
        type="button"
        className={`mobile-backdrop ${open ? "show" : ""}`}
        onClick={closeMenu}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
      />

      <aside
        id="postcorp-mobile-menu"
        className={`mobile-panel ${open ? "show" : ""}`}
        aria-hidden={!open}
      >
        <div className="mobile-panel-head">
          <Link href="/" onClick={closeMenu} aria-label="Postcorp home">
            <img src="/images/logo.png" alt="Postcorp Glass and Aluminium" />
          </Link>
          <button type="button" onClick={closeMenu} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        <div className="mobile-panel-title">
          <span>Explore Postcorp</span>
          <h3>Menu</h3>
        </div>

        <nav className="mobile-panel-links" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              <span className="mobile-link-label">{link.label}</span>
              <span className="mobile-link-arrow" aria-hidden="true">›</span>
            </Link>
          ))}
        </nav>

        <Link href="/quote" className="mobile-quote" onClick={closeMenu}>
          Request a Quote
        </Link>

        <div className="mobile-actions">
          <a href="tel:+263772957823">
            <Phone size={18} />
            <span>Call Us</span>
          </a>
          <a href="https://wa.me/263772957823" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={18} />
            <span>WhatsApp</span>
          </a>
        </div>
      </aside>
    </div>
  );
}
