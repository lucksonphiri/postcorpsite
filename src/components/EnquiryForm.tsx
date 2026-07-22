"use client";

import {
  FormEvent,
  useState,
} from "react";

type EnquiryFormState = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialFormState: EnquiryFormState = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function EnquiryForm() {
  const [form, setForm] =
    useState<EnquiryFormState>(
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
    field: keyof EnquiryFormState,
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
        "/api/enquiries",
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
            "The enquiry could not be submitted.",
        );
      }

      setSuccess(
        data.message ||
          "Your enquiry has been received.",
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
      className="contact-enquiry-form"
      onSubmit={handleSubmit}
    >
      {error && (
        <div
          className="contact-form-message error"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="contact-form-message success"
          role="status"
        >
          <strong>
            Enquiry received
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
      />

      <input
        type="text"
        value={form.subject}
        onChange={(event) =>
          updateField(
            "subject",
            event.target.value,
          )
        }
        placeholder="Subject"
        required
      />

      <textarea
        value={form.message}
        onChange={(event) =>
          updateField(
            "message",
            event.target.value,
          )
        }
        placeholder="How can we help?"
        rows={7}
        required
      />

      <button
        type="submit"
        disabled={submitting}
      >
        {submitting
          ? "Sending enquiry..."
          : "Send Enquiry"}
      </button>
    </form>
  );
}