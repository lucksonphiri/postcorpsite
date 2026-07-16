import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import fs from "node:fs";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Create .env.local first.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initialiseDatabase() {
  const client = await pool.connect();

  try {
    const schema = fs.readFileSync(
      new URL("./schema.sql", import.meta.url),
      "utf8"
    );

    await client.query(schema);

    const email =
      process.env.ADMIN_EMAIL || "admin@postcorpglass.co.zw";

    const password =
      process.env.ADMIN_PASSWORD || "ChangeMe123!";

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        is_active
      )
      VALUES ($1, $2, $3, $4, TRUE)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        is_active = TRUE,
        updated_at = NOW()
      `,
      [
        "Postcorp Administrator",
        email,
        passwordHash,
        "administrator",
      ]
    );

    await client.query(`
      INSERT INTO slides (
        title,
        subtitle,
        image_url,
        button_text,
        button_url,
        display_order
      )
      SELECT
        'Shaping Spaces with Glass & Aluminium',
        'We design, manufacture and install customised solutions for commercial and domestic clients.',
        '/images/slide01.jpg',
        'Request a Quote',
        '/quote',
        1
      WHERE NOT EXISTS (
        SELECT 1 FROM slides
      )
    `);

    await client.query(`
      INSERT INTO services (
        title,
        slug,
        summary,
        description,
        image_url,
        display_order,
        is_featured
      )
      VALUES
        (
          'Aluminium Windows & Doors',
          'aluminium-windows-doors',
          'Custom aluminium windows, hinged doors, sliding doors and folding systems.',
          'Designed, manufactured and installed to suit each project.',
          '/images/pic01p.jpg',
          1,
          TRUE
        ),
        (
          'Shopfronts & Glazing',
          'shopfronts-glazing',
          'Architectural shopfronts, flush glazing, mirrors and general glazing.',
          'Commercial and institutional glass solutions.',
          '/images/pic02p.jpg',
          2,
          TRUE
        ),
        (
          'Shower Cubicles',
          'shower-cubicles',
          'Framed and frameless shower cubicles for modern bathrooms.',
          'Custom-measured and professionally installed.',
          '/images/pic03p.jpg',
          3,
          TRUE
        ),
        (
          'Partitions & Ceilings',
          'partitions-ceilings',
          'Drywall, aluminium and glass partitions plus suspended ceilings.',
          'Functional interior fit-out systems.',
          '/images/pic04p.jpg',
          4,
          TRUE
        ),
        (
          'Kitchens & Built-ins',
          'kitchens-built-ins',
          'Kitchens, built-in cupboards and customised interior fittings.',
          'Practical storage and finishing solutions.',
          '/images/pic05.jpg',
          5,
          TRUE
        ),
        (
          'Balustrades & Skylights',
          'balustrades-skylights',
          'Stainless and glass balustrades, skylights and specialised features.',
          'Made to enhance safety and architectural appeal.',
          '/images/pic06.jpg',
          6,
          TRUE
        )
      ON CONFLICT (slug) DO NOTHING
    `);

    await client.query(`
      INSERT INTO projects (
        title,
        slug,
        client,
        location,
        category,
        year,
        summary,
        image_url,
        display_order,
        is_featured
      )
      VALUES
        (
          'Chinhoyi University Heights',
          'chinhoyi-university-heights',
          'First Mutual',
          'Chinhoyi',
          'Institutional',
          '2024-2025',
          'Aluminium windows and doors, louvres and partitions for 385 accommodation units.',
          '/images/pic01pr.jpg',
          1,
          TRUE
        ),
        (
          'Cork Corner Simbisa Mall',
          'cork-corner-simbisa',
          'Simbisa Brands',
          'Avondale, Harare',
          'Commercial',
          '2023',
          'Shopfronts, ceilings, balustrades and partitions for leading restaurant brands.',
          '/images/pic02pr.jpg',
          2,
          TRUE
        ),
        (
          'Zimbabwe Military Academy',
          'zimbabwe-military-academy',
          'ZMA',
          'Gweru',
          'Institutional',
          'Completed',
          'Windows, doors, shopfronts, glazing and maintenance works.',
          '/images/pic03pr.jpg',
          3,
          TRUE
        ),
        (
          'ZIMRA Beitbridge Housing',
          'zimra-beitbridge-housing',
          'Raubex / Masimba',
          'Beitbridge',
          'Residential',
          '2023',
          'Aluminium windows, mirrors and steel window frame glazing for 370 units.',
          '/images/pic04pr.jpg',
          4,
          TRUE
        )
      ON CONFLICT (slug) DO NOTHING
    `);

    const branches = [
      {
        name: "Harare",
        address: "53 Cameroon Street, Harare",
        phonePrimary: "+263 77 295 7823",
        phoneSecondary: "+263 71 401 7849",
        email: "sales@postcorpglass.co.zw",
        displayOrder: 1,
      },
      {
        name: "Masvingo",
        address: "286 Fort Victoria Hughes Street, Masvingo",
        phonePrimary: "+263 77 152 9898",
        phoneSecondary: "+263 77 563 0405",
        email: "masvingosales@postcorpglass.co.zw",
        displayOrder: 2,
      },
      {
        name: "Bulawayo",
        address: "17 Steelworks Road, Belmont, Bulawayo",
        phonePrimary: "+263 78 722 2324",
        phoneSecondary: "+263 78 825 3089",
        email: "bulawayosales@postcorpglass.co.zw",
        displayOrder: 3,
      },
    ];

    for (const branch of branches) {
      const existingBranch = await client.query(
        `
        SELECT id
        FROM branches
        WHERE name = $1
        LIMIT 1
        `,
        [branch.name]
      );

      if (existingBranch.rowCount === 0) {
        await client.query(
          `
          INSERT INTO branches (
            name,
            address,
            phone_primary,
            phone_secondary,
            email,
            display_order
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            branch.name,
            branch.address,
            branch.phonePrimary,
            branch.phoneSecondary,
            branch.email,
            branch.displayOrder,
          ]
        );
      }
    }

    const faqs = [
      {
        question: "What services does Postcorp offer?",
        answer:
          "We provide aluminium windows and doors, shopfronts, shower cubicles, glazing, partitions, ceilings, kitchens, built-in cupboards, balustrades, skylights and maintenance.",
        category: "Services",
        keywords: "services products aluminium glass",
        displayOrder: 1,
      },
      {
        question: "How do I request a quote?",
        answer:
          "Use the Request a Quote page and provide your contact details, project location, service required and approximate measurements.",
        category: "Quotations",
        keywords: "quote pricing estimate",
        displayOrder: 2,
      },
      {
        question: "Where are your branches?",
        answer:
          "Postcorp has branches in Harare, Masvingo and Bulawayo.",
        category: "Branches",
        keywords: "location office branch",
        displayOrder: 3,
      },
    ];

    for (const faq of faqs) {
      const existingFaq = await client.query(
        `
        SELECT id
        FROM faqs
        WHERE question = $1
        LIMIT 1
        `,
        [faq.question]
      );

      if (existingFaq.rowCount === 0) {
        await client.query(
          `
          INSERT INTO faqs (
            question,
            answer,
            category,
            keywords,
            display_order
          )
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            faq.question,
            faq.answer,
            faq.category,
            faq.keywords,
            faq.displayOrder,
          ]
        );
      }
    }

    console.log("Database initialised successfully.");
    console.log(`Administrator email: ${email}`);
    console.log(
      "The administrator password is the value of ADMIN_PASSWORD in .env.local."
    );
  } catch (error) {
    console.error("Database initialisation failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initialiseDatabase();