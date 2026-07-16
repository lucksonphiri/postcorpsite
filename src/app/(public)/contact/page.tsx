'use client';

import PageHero from '@/components/PageHero';
import { Building2, Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';

const branches = [
  {
    name: 'Harare',
    address: '53 Cameroon Street, Harare, Zimbabwe',
    phones: ['+263 77 295 7823', '+263 71 401 7849'],
    email: 'sales@postcorpglass.co.zw',
    map: 'https://www.google.com/maps/search/?api=1&query=53+Cameroon+Street+Harare+Zimbabwe',
  },
  {
    name: 'Masvingo',
    address: '286 Fort Victoria Hughes Street, Masvingo, Zimbabwe',
    phones: ['+263 77 152 9898', '+263 77 563 0405'],
    email: 'masvingosales@postcorpglass.co.zw',
    map: 'https://www.google.com/maps/search/?api=1&query=286+Fort+Victoria+Hughes+Street+Masvingo+Zimbabwe',
  },
  {
    name: 'Bulawayo',
    address: '17 Steelworks Road, Belmont, Bulawayo, Zimbabwe',
    phones: ['+263 78 722 2324', '+263 78 825 3089'],
    email: 'bulawayosales@postcorpglass.co.zw',
    map: 'https://www.google.com/maps/search/?api=1&query=17+Steelworks+Road+Belmont+Bulawayo+Zimbabwe',
  },
];

export default function Page() {
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const response = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setDone(true);
      form.reset();
    }
  }

  return (
    <main>
      <PageHero
        title="Contact Us"
        text="Visit or contact our teams in Harare, Masvingo and Bulawayo."
      />

      <section className="section contact-branches-section">
        <div className="container">
          <div className="contact-heading">
            <div>
              <div className="eyebrow">Our Locations</div>
              <h2 className="section-title">Speak to a branch near you</h2>
            </div>
            <p>
              Our teams are available to discuss quotations, product selection,
              measurements, site visits and installation requirements.
            </p>
          </div>

          <div className="contact-branch-grid">
            {branches.map((branch) => (
              <article className="contact-branch-card" key={branch.name}>
                <div className="branch-card-top">
                  <span className="branch-icon"><Building2 size={24} /></span>
                  <div>
                    <span>Postcorp Branch</span>
                    <h3>{branch.name}</h3>
                  </div>
                </div>

                <div className="branch-details">
                  <div>
                    <MapPin size={19} />
                    <p>{branch.address}</p>
                  </div>
                  <div>
                    <Phone size={19} />
                    <p>
                      {branch.phones.map((phone) => (
                        <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
                      ))}
                    </p>
                  </div>
                  <div>
                    <Mail size={19} />
                    <p><a href={`mailto:${branch.email}`}>{branch.email}</a></p>
                  </div>
                  <div>
                    <Clock3 size={19} />
                    <p>Monday to Friday, 08:00–17:00</p>
                  </div>
                </div>

                <a
                  className="branch-map-button"
                  href={branch.map}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open location in Google Maps
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-grey contact-form-section">
        <div className="container contact-form-layout">
          <div className="contact-form-copy">
            <div className="eyebrow">Send an Enquiry</div>
            <h2 className="section-title">Tell us about your project</h2>
            <p>
              Share your requirements and the relevant branch will contact you.
              For a more detailed costing request, use the Request a Quote page.
            </p>

            <div className="contact-highlight">
              <Phone size={24} />
              <div>
                <strong>Head Office</strong>
                <a href="tel:+263772957823">+263 77 295 7823</a>
              </div>
            </div>
          </div>

          <form className="form admin-card contact-form-card" onSubmit={submit}>
            {done && <div className="notice">Your enquiry has been sent successfully.</div>}
            <input className="input" name="name" required placeholder="Full name" />
            <input className="input" name="email" type="email" placeholder="Email address" />
            <input className="input" name="phone" required placeholder="Phone number" />
            <input className="input" name="subject" placeholder="Subject" />
            <textarea name="message" required placeholder="How can we help?" />
            <button className="btn btn-red">Send Enquiry</button>
          </form>
        </div>
      </section>
    </main>
  );
}
