import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type EnquiryRequestBody = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
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

  return `ENQ-${year}-${paddedId}`;
}

export async function POST(request: NextRequest) {
  try {
    const body =
      (await request.json()) as EnquiryRequestBody;

    const fullName = cleanText(body.fullName, 150);
    const email = cleanText(body.email, 200).toLowerCase();
    const phone = cleanText(body.phone, 80);
    const subject = cleanText(body.subject, 250);
    const message = cleanText(body.message, 7000);

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

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Subject is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Step 1:
     * Save the enquiry in its own database table.
     */
    const insertedRows = await sql(
      `
        INSERT INTO contact_enquiries (
          full_name,
          email,
          phone,
          subject,
          message,
          status,
          email_notification_status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'New',
          'Pending'
        )
        RETURNING
          id,
          created_at
      `,
      [
        fullName,
        email,
        phone || null,
        subject,
        message,
      ],
    );

    const insertedEnquiry = insertedRows[0];

    if (!insertedEnquiry) {
      throw new Error(
        "The enquiry could not be saved.",
      );
    }

    const enquiryId = Number(insertedEnquiry.id);
    const referenceNumber =
      formatReferenceNumber(enquiryId);

    await sql(
      `
        UPDATE contact_enquiries
        SET
          reference_number = $1,
          updated_at = NOW()
        WHERE id = $2
      `,
      [
        referenceNumber,
        enquiryId,
      ],
    );

    /*
     * Step 2:
     * Use the same Resend API key and the same
     * destination email used by quotation requests.
     */
    const resendApiKey =
      process.env.RESEND_API_KEY;

    const notificationEmail =
      process.env.ENQUIRY_NOTIFICATION_EMAIL ||
      process.env.QUOTE_NOTIFICATION_EMAIL;

    const fromEmail =
      process.env.ENQUIRY_FROM_EMAIL ||
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
        "The enquiry email environment variables are incomplete.";
    } else {
      try {
        const resend =
          new Resend(resendApiKey);

        const submittedAt = new Date(
          insertedEnquiry.created_at,
        ).toLocaleString("en-ZW", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Africa/Harare",
        });

        const emailResult =
          await resend.emails.send({
            from: fromEmail,
            to: [notificationEmail],

            /*
             * Staff can click Reply and respond
             * directly to the customer.
             */
            replyTo: email,

            subject:
              `New Postcorp Website Enquiry – ${referenceNumber}`,

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
                    New Postcorp Website Enquiry
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
                        New Website Enquiry
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
                        ${escapeHtml(referenceNumber)}
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
                              width: 170px;
                              padding: 10px 0;
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
                            ${escapeHtml(fullName)}
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
                            ${escapeHtml(email)}
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
                            ${escapeHtml(
                              phone || "Not provided",
                            )}
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
                            Subject
                          </td>

                          <td
                            style="
                              padding: 10px 0;
                              border-bottom: 1px solid #eceff1;
                            "
                          >
                            ${escapeHtml(subject)}
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
                          Customer message
                        </h2>

                        <p
                          style="
                            margin: 0;
                            color: #4f5962;
                            line-height: 1.65;
                          "
                        >
                          ${escapeHtml(message).replaceAll(
                            "\n",
                            "<br />",
                          )}
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
                        to ${escapeHtml(fullName)}.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,

            text: `
New Postcorp Website Enquiry

Reference: ${referenceNumber}
Customer: ${fullName}
Email: ${email}
Phone: ${phone || "Not provided"}
Subject: ${subject}
Submitted: ${submittedAt}

Message:
${message}

Reply directly to this email to respond to the customer.
            `.trim(),
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
          "Enquiry email error:",
          error,
        );
      }
    }

    /*
     * Step 3:
     * Store the result of the email attempt.
     */
    await sql(
      `
        UPDATE contact_enquiries
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
        enquiryId,
      ],
    );

    return NextResponse.json(
      {
        success: true,
        referenceNumber,
        message:
          "Your enquiry has been received. A Postcorp representative will contact you shortly.",
        emailNotificationStatus,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Contact enquiry error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The enquiry could not be submitted.",
      },
      {
        status: 500,
      },
    );
  }
}