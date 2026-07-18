import QuoteForm from "@/components/QuoteForm";

export const metadata = {
  title:
    "Request a Quote | Postcorp Glass & Aluminium",
  description:
    "Request a quotation for Postcorp glass, aluminium and shopfitting services.",
};

export default function QuotePage() {
  return (
    <main>
      <section
        className="page-hero quote-page-hero"
      >
        <div className="container">
          <p className="eyebrow">
            Start your project
          </p>

          <h1>
            Request a Quote
          </h1>

          <p>
            Tell us about your project and
            a Postcorp representative will
            contact you.
          </p>
        </div>
      </section>

      <section className="section section-grey">
        <div className="container">
          <div className="quote-page-grid">
            <div>
              <p className="eyebrow">
                Project enquiry
              </p>

              <h2 className="section-title">
                Let us understand your requirements
              </h2>

              <div className="redline" />

              <p>
                Provide your contact details,
                preferred service, project location
                and any approximate measurements
                available.
              </p>

              <div className="quote-contact-card">
                <strong>
                  Need immediate assistance?
                </strong>

                <p>
                  Call or WhatsApp:
                  {" "}
                  +263 77 295 7823
                </p>

                <p>
                  Email:
                  {" "}
                  sales@postcorpglass.co.zw
                </p>
              </div>
            </div>

            <div className="quote-form-card">
              <QuoteForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}