import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const WHATSAPP = "+263 77 295 7823";

type KnowledgeItem = { keywords: string[]; answer: string };

const knowledgeBase: KnowledgeItem[] = [
  { keywords: ["hello", "hi", "hey", "good morning", "good afternoon"], answer: "Hello! Welcome to Postcorp Glass & Aluminium. How may I assist you today?" },
  { keywords: ["about", "who are you", "company", "experience"], answer: "Postcorp Glass & Aluminium is a Zimbabwean company with more than 20 years of experience in glass, aluminium and shopfitting solutions for commercial and domestic clients." },
  { keywords: ["service", "services", "what do you do", "offer"], answer: "Postcorp provides aluminium sliding and folding doors, windows, shower cubicles, shopfronts, glass and aluminium partitions, suspended ceilings, glazing, balustrades, skylights, kitchens, built-in cupboards, shopfitting, repairs and maintenance." },
  { keywords: ["product", "products", "window", "door", "glass", "aluminium"], answer: "Our products include aluminium windows, sliding and folding doors, hinged doors, shopfronts, shower cubicles, glass partitions, balustrades, skylights and customised glass and aluminium systems." },
  { keywords: ["quote", "quotation", "price", "cost", "estimate", "how much"], answer: "Use the Request a Quote page and provide your contact details, project location, required product or service, approximate measurements and any photographs or drawings. A Postcorp representative will contact you." },
  { keywords: ["harare"], answer: "The Harare branch is at 53 Cameroon Street, Harare. Call +263 77 295 7823 or +263 71 401 7849. Email sales@postcorpglass.co.zw." },
  { keywords: ["masvingo"], answer: "The Masvingo branch is at 286 Fort Victoria Hughes Street, Masvingo. Call +263 77 152 9898 or +263 77 563 0405. Email masvingosales@postcorpglass.co.zw." },
  { keywords: ["bulawayo"], answer: "The Bulawayo branch is at 17 Steelworks Road, Belmont, Bulawayo. Call +263 78 722 2324 or +263 78 825 3089. Email bulawayosales@postcorpglass.co.zw." },
  { keywords: ["branch", "branches", "location", "locations", "address", "where are you"], answer: "Postcorp has branches in Harare, Masvingo and Bulawayo. Harare: 53 Cameroon Street. Masvingo: 286 Fort Victoria Hughes Street. Bulawayo: 17 Steelworks Road, Belmont." },
  { keywords: ["contact", "phone", "telephone", "call", "email"], answer: "Contact Postcorp through the Harare office on +263 77 295 7823 or email sales@postcorpglass.co.zw. You may also use the Contact page or WhatsApp." },
  { keywords: ["whatsapp", "human", "person", "agent", "speak to someone"], answer: `Contact a Postcorp representative on WhatsApp at ${WHATSAPP}.` },
  { keywords: ["project", "projects", "portfolio", "clients", "previous work"], answer: "Postcorp has completed projects for banks, universities, housing developments, restaurants, government institutions, churches and commercial organisations across Zimbabwe. Visit the Projects page to view selected work." },
  { keywords: ["shower", "cubicle", "bathroom"], answer: "Postcorp supplies and installs framed and frameless glass and aluminium shower cubicles customised to the client's measurements and preferred design." },
  { keywords: ["shopfront", "shop front", "storefront"], answer: "Postcorp designs, manufactures and installs aluminium and glass shopfronts for retail, commercial and institutional buildings." },
  { keywords: ["partition", "partitions", "office partition"], answer: "Postcorp provides drywall, aluminium and glass partitions, including frameless glass partition systems for offices and commercial spaces." },
  { keywords: ["ceiling", "ceilings", "suspended ceiling"], answer: "Postcorp supplies and installs suspended ceilings and plasterboard ceilings for offices, shops, institutions and residential properties." },
  { keywords: ["repair", "repairs", "maintenance", "fix", "replacement"], answer: "Postcorp provides shopfitting, aluminium, glazing and maintenance services. Send photographs and a description of the problem when requesting assistance." },
  { keywords: ["career", "careers", "job", "jobs", "vacancy", "employment"], answer: "Available employment opportunities are published on the Careers page, together with requirements, location and application deadline." },
];

function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function staticAnswer(question: string) {
  const q = normalise(question);
  let best: KnowledgeItem | null = null;
  let score = 0;
  for (const item of knowledgeBase) {
    let current = 0;
    for (const keyword of item.keywords) {
      const k = normalise(keyword);
      if (q.includes(k)) current += k.split(" ").length + 1;
    }
    if (current > score) {
      score = current;
      best = item;
    }
  }
  return score > 0 ? best?.answer ?? null : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Please enter a question." }, { status: 400 });

    try {
      const rows = await sql`SELECT question, answer, keywords FROM faqs WHERE is_active=true ORDER BY display_order, id`;
      const words = normalise(message).split(" ").filter((word) => word.length > 2);
      const match = (rows as any[]).find((row) => {
        const haystack = normalise(`${row.question || ""} ${row.keywords || ""}`);
        return words.some((word) => haystack.includes(word));
      });
      if (match?.answer) return NextResponse.json({ answer: match.answer, fallback: false });
    } catch {
      // Continue with the built-in knowledge base when the database is unavailable.
    }

    const answer = staticAnswer(message);
    if (answer) return NextResponse.json({ answer, fallback: false });

    return NextResponse.json({
      answer: `I do not have a confirmed answer for that question. Please contact a Postcorp representative on WhatsApp at ${WHATSAPP}.`,
      fallback: true,
    });
  } catch {
    return NextResponse.json({
      answer: `I am currently unable to answer that question. Please contact Postcorp on WhatsApp at ${WHATSAPP}.`,
      fallback: true,
    });
  }
}
