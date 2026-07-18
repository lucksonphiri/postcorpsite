import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type QuoteRequestBody = {
  fullName?: unknown;
  company?: unknown;
  phone?: unknown;
  email?: unknown;
  projectLocation?: unknown;
  service?: unknown;
  projectDescription?: unknown;
};

function cleanText(value: unknown, maximumLength = 5000) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maximumLength);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatReferenceNumber(id: number) {
  const year = new Date().getFullYear();
  const paddedId = String(id).padStart(6, "0");

  return `PQ-${year}-${paddedId}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuoteRequestBody;

    const fullName = cleanText(body.fullName, 150);
    const company = cleanText(body.company, 150);
    const phone = cleanText(body.phone, 80);
    const email = cleanText(body.email, 200).toLowerCase();
    const projectLocation = cleanText(body.projectLocation, 250);
    const service = cleanText(body.service, 200);
    const projectDescription = cleanText(
      body.projectDescription,
      7000,
    );

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          error: "Full name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid email address is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select a service.",
        },
        {
          status: 400,
        },
      );
    }

    if (!projectDescription) {
      return NextResponse.json(
        {
          success: false,
          error: "Project description is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Step 1:
     * Save the quotation request before attempting email delivery.
     */
    const insertedRows = await sql(
      `
        INSERT INTO quote_requests (
          full_name,
          company,
          phone,
          email,
          project_location,
          service,
          project_description,
          status,
          email_notification_status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          'New',
          'Pending'
        )
        RETURNING
          id,
          created_at
      `,
      [
        fullName,
        company || null,
        phone,
        email,
        projectLocation || null,
        service,
        projectDescription,
      ],
    );

    const insertedQuote = insertedRows[0];

    if (!insertedQuote) {
      throw new Error(
        "The quotation request could not be saved.",
      );
    }

    const quotationId = Number(insertedQuote.id);
    const referenceNumber =
      formatReferenceNumber(quotationId);

    await sql(
      `
        UPDATE quote_requests
        SET
          reference_number = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [
        referenceNumber,
        quotationId,
      ],
    );

    /*
     * Step 2:
     * Attempt to send the notification email.
     */
    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationEmail =
      process.env.QUOTE_NOTIFICATION_EMAIL;
    const fromEmail =
      process.env.QUOTE_FROM_EMAIL;

    let emailNotificationStatus = "Failed";
    let emailMessageId: string | null = null;
    let emailError: string | null = null;

    if (
      !resendApiKey ||
      !notificationEmail ||
      !fromEmail
    ) {
      emailError =
        "The quotation email environment variables are incomplete.";
    } else {
      try {
        const resend = new Resend(resendApiKey);

        const safeReference =
          escapeHtml(referenceNumber);
        const safeFullName =
          escapeHtml(fullName);
        const safeCompany =
          escapeHtml(company || "Not provided");
        const safePhone =
          escapeHtml(phone);
        const safeEmail =
          escapeHtml(email);
        const safeLocation =
          escapeHtml(
            projectLocation || "Not provided",
          );
        const safeService =
          escapeHtml(service);
        const safeDescription =
          escapeHtml(projectDescription).replaceAll(
            "\n",
            "<br />",
          );

        const submittedAt = new Date(
          insertedQuote.created_at,
        ).toLocaleString("en-ZW", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Africa/Harare",
        });

        const emailResult =
          await resend.emails.send({
            from: fromEmail,
            to: [notificationEmail],
            replyTo: email,
            subject:
              `New Postcorp Quotation Request – ${referenceNumber}`,
            html: `
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                  />
                  <title>
                    New Postcorp Quotation Request
                  </title>
                </head>

                <body
                  style="
                    margin: 0;
                    padding: 0;
                    background: #f4f5f6;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #26313a;
                  "
                >
                  <div
                    style="
                      max-width: 720px;
                      margin: 30px auto;
                      background: #ffffff;
                      border-radius: 12px;
                      overflow: hidden;
                      box-shadow: 0 12px 35px rgba(0,0,0,0.08);
                    "
                  >
                    <div
                      style="
                        padding: 24px 28px;
                        background: #343a40;
                        border-bottom: 5px solid #ed1c24;
                      "
                    >
                      <h1
                        style="
                          margin: 0;
                          color: #ffffff;
                          font-size: 24px;
                        "
                      >
                        New Quotation Request
                      </h1>

                      <p
                        style="
                          margin: 8px 0 0;
                          color: #dfe3e6;
                        "
                      >
                        Postcorp Glass &amp; Aluminium
                      </p>
                    </div>

                    <div style="padding: 28px;">
                      <div
                        style="
                          padding: 15px 18px;
                          margin-bottom: 24px;
                          background: #fff1f2;
                          border-left: 5px solid #ed1c24;
                          border-radius: 6px;
                        "
                      >
                        <strong>
                          Reference:
                        </strong>
                        ${safeReference}
                      </div>

                      <table
                        role="presentation"
                        style="
                          width: 100%;
                          border-collapse: collapse;
                        "
                      >
                        <tr>
                          <td
                            style="
                              padding: 10px 0;
                              width: 190px;
                              font-weight: bold;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            Customer
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${safeFullName}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 10px 0;
                              font-weight: bold;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            Company
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${safeCompany}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 10px 0;
                              font-weight: bold;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            Phone
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${safePhone}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 10px 0;
                              font-weight: bold;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            Email
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${safeEmail}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 10px 0;
                              font-weight: bold;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            Project location
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${safeLocation}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 10px 0;
                              font-weight: bold;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            Service
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${safeService}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style="
                              padding: 10px 0;
                              font-weight: bold;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            Submitted
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${escapeHtml(submittedAt)}
                          </td>
                        </tr>
                      </table>

                      <div
                        style="
                          margin-top: 24px;
                          padding: 18px;
                          background: #f7f8f9;
                          border-radius: 8px;
                        "
                      >
                        <h2
                          style="
                            margin: 0 0 10px;
                            color: #343a40;
                            font-size: 17px;
                          "
                        >
                          Project description
                        </h2>

                        <p
                          style="
                            margin: 0;
                            line-height: 1.65;
                            color: #4f5962;
                          "
                        >
                          ${safeDescription}
                        </p>
                      </div>

                      <p
                        style="
                          margin: 24px 0 0;
                          color: #6b737b;
                          font-size: 13px;
                          line-height: 1.6;
                        "
                      >
                        Reply directly to this email to respond
                        to ${safeFullName}.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            text: `
New Postcorp Quotation Request

Reference: ${referenceNumber}
Customer: ${fullName}
Company: ${company || "Not provided"}
Phone: ${phone}
Email: ${email}
Project location: ${projectLocation || "Not provided"}
Service: ${service}
Submitted: ${submittedAt}

Project description:
${projectDescription}

Reply to this email to respond directly to the customer.
            `.trim(),
            tags: [
              {
                name: "type",
                value: "quotation_request",
              },
              {
                name: "reference",
                value: referenceNumber.replaceAll(
                  /[^a-zA-Z0-9_-]/g,
                  "_",
                ),
              },
            ],
          });

        if (emailResult.error) {
          throw new Error(
            emailResult.error.message,
          );
        }

        emailNotificationStatus = "Sent";
        emailMessageId =
          emailResult.data?.id || null;
      } catch (error) {
        emailNotificationStatus = "Failed";
        emailError =
          error instanceof Error
            ? error.message
            : "Unknown email delivery error";

        console.error(
          "Quotation email error:",
          error,
        );
      }
    }

    /*
     * Step 3:
     * Record the email result without deleting
     * the saved quotation.
     */
    await sql(
      `
        UPDATE quote_requests
        SET
          email_notification_status = $1,
          email_message_id = $2,
          email_error = $3,
          updated_at = NOW()
        WHERE id = $4
      `,
      [
        emailNotificationStatus,
        emailMessageId,
        emailError,
        quotationId,
      ],
    );

    return NextResponse.json(
      {
        success: true,
        referenceNumber,
        message:
          "Your quotation request has been received. A Postcorp representative will contact you shortly.",
        emailNotificationStatus,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Quotation request error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The quotation request could not be submitted.",
      },
      {
        status: 500,
      },
    );
  }
}