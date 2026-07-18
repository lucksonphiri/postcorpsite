"use client";

import {
  FormEvent,
  useState,
} from "react";

type QuoteFormState = {
  fullName: string;
  company: string;
  phone: string;
  email: string;
  projectLocation: string;
  service: string;
  projectDescription: string;
};

const initialFormState: QuoteFormState = {
  fullName: "",
  company: "",
  phone: "",
  email: "",
  projectLocation: "",
  service: "",
  projectDescription: "",
};

const services = [
  "Aluminium Sliding Doors",
  "Aluminium Folding Doors",
  "Aluminium Windows",
  "Shower Cubicles",
  "Aluminium Shopfronts",
  "Glass and Aluminium Partitions",
  "Suspended Ceilings",
  "Glazing",
  "Balustrades",
  "Skylights",
  "Shopfitting Repairs and Maintenance",
  "Other",
];

export default function QuoteForm() {
  const [form, setForm] =
    useState<QuoteFormState>(
      initialFormState,
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [referenceNumber, setReferenceNumber] =
    useState("");

  function updateField(
    field: keyof QuoteFormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    setReferenceNumber("");

    try {
      const response = await fetch(
        "/api/quotes",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        message?: string;
        referenceNumber?: string;
        error?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "The quotation request could not be submitted.",
        );
      }

      setSuccess(
        data.message ||
          "Your quotation request has been received.",
      );

      setReferenceNumber(
        data.referenceNumber || "",
      );

      setForm(initialFormState);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="quote-request-form"
      onSubmit={handleSubmit}
    >
      {error && (
        <div
          className="quote-form-message error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="quote-form-message success"
          role="status"
        >
          <strong>
            Request received
          </strong>

          <p>{success}</p>

          {referenceNumber && (
            <p>
              Your reference number is:
              {" "}
              <strong>
                {referenceNumber}
              </strong>
            </p>
          )}
        </div>
      )}

      <input
        type="text"
        value={form.fullName}
        onChange={(event) =>
          updateField(
            "fullName",
            event.target.value,
          )
        }
        placeholder="Full name"
        autoComplete="name"
        required
      />

      <input
        type="text"
        value={form.company}
        onChange={(event) =>
          updateField(
            "company",
            event.target.value,
          )
        }
        placeholder="Company or organisation"
        autoComplete="organization"
      />

      <input
        type="tel"
        value={form.phone}
        onChange={(event) =>
          updateField(
            "phone",
            event.target.value,
          )
        }
        placeholder="Phone number"
        autoComplete="tel"
        required
      />

      <input
        type="email"
        value={form.email}
        onChange={(event) =>
          updateField(
            "email",
            event.target.value,
          )
        }
        placeholder="Email address"
        autoComplete="email"
        required
      />

      <input
        type="text"
        value={form.projectLocation}
        onChange={(event) =>
          updateField(
            "projectLocation",
            event.target.value,
          )
        }
        placeholder="Project location"
      />

      <select
        value={form.service}
        onChange={(event) =>
          updateField(
            "service",
            event.target.value,
          )
        }
        required
      >
        <option value="">
          Select service
        </option>

        {services.map((service) => (
          <option
            key={service}
            value={service}
          >
            {service}
          </option>
        ))}
      </select>

      <textarea
        value={form.projectDescription}
        onChange={(event) =>
          updateField(
            "projectDescription",
            event.target.value,
          )
        }
        placeholder="Project description, approximate measurements and preferred completion date"
        rows={7}
        required
      />

      <button
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Submitting request..."
          : "Submit Request"}
      </button>
    </form>
  );
}