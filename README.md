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

- Existing design assets remain in the project under `public/images`.
- New images selected from the administrator dashboard are uploaded online to Vercel Blob under the `public/images/` prefix.
- Uploaded PDF, DOC and DOCX files are stored under the `public/documents/` prefix.
- The database stores the returned public Blob URL, so the files remain available after deployment and are not tied to one computer.
- Administrators can delete or replace old uploaded files from the CMS.

## Security notes

- Change the starter admin password immediately.
- Never commit `.env.local`.
- Use a strong `JWT_SECRET`.
- Add rate limiting and CAPTCHA before a high-traffic public launch.
- Configure email notifications for quotation and enquiry submissions.

## Version 3 improvements
- Responsive slide-in mobile menu.
- Logout returns directly to the public home page.
- Admin file picker uploads images to Vercel Blob under `public/images/` and documents under `public/documents/`.
- Existing uploaded files and content can be deleted or replaced.
- Admin content is displayed as attractive preview cards instead of a plain table.
- Products and projects support multiple gallery images.
- Administrators can create Content Editor accounts from Admin > Users.

### Important hosting note
The CMS uses Vercel Blob for new uploads. It does not write uploaded files to the local or deployed Next.js filesystem. Configure `BLOB_READ_WRITE_TOKEN` before testing uploads.
