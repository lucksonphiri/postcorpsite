# Postcorp Glass & Aluminium Dynamic Website

A complete Next.js and PostgreSQL website with a public corporate site, custom CMS, quotation requests, contact enquiries and a database-backed chatbot.

## Included

- Animated responsive public website
- Home, About, Services, Products, Projects, Gallery, News, Careers, Downloads, Quote and Contact pages
- Administrator login and content dashboard
- CMS modules for slides, services, products, projects, news, gallery, testimonials, clients, downloads, vacancies, branches and chatbot FAQs
- PostgreSQL schema and starter content
- Quote and contact database storage
- Chatbot with FAQ matching and safe fallback responses
- Postcorp branding, images, branch contacts and social links

## Setup

1. Install Node.js 20 or newer.
2. Open this project folder in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local`.
5. Add your PostgreSQL/Neon connection string to `DATABASE_URL`.
6. Set a long random `JWT_SECRET`.
7. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
8. Run `npm run db:init`.
9. Run `npm run dev`.
10. Open `http://localhost:3000`.
11. Open `http://localhost:3000/admin` for the CMS.

## Deployment

Deploy to Vercel, add the same environment variables in Project Settings, and run `npm run db:init` once against the production database before opening the admin dashboard.

## Media management

The starter CMS accepts image and document URLs. Images supplied with this project are already under `public/images`. For production uploads, connect Cloudinary, Vercel Blob, AWS S3 or another persistent object-storage provider; do not rely on writing uploaded files to the Vercel filesystem.

## Security notes

- Change the starter admin password immediately.
- Never commit `.env.local`.
- Use a strong `JWT_SECRET`.
- Add rate limiting and CAPTCHA before a high-traffic public launch.
- Configure email notifications for quotation and enquiry submissions.

## Version 3 improvements
- Responsive slide-in mobile menu.
- Logout returns directly to the public home page.
- Admin file picker uploads images and PDFs into `public/images`.
- Existing uploaded files and content can be deleted or replaced.
- Admin content is displayed as attractive preview cards instead of a plain table.
- Products and projects support multiple gallery images.
- Administrators can create Content Editor accounts from Admin > Users.

### Important hosting note
Saving directly into `public/images` works on a local computer and a persistent Node.js/VPS server. Serverless hosts such as Vercel use temporary filesystems, so production uploads there should later be connected to persistent cloud storage such as Cloudinary, Vercel Blob, S3 or UploadThing.
