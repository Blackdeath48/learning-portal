# EthixLearn – Ethics & Compliance Training Portal

A Next.js 14 platform for delivering ethics and compliance courses with full xAPI (Tin Can API) tracking. The application integrates with a Neon-hosted PostgreSQL database via Prisma and includes an administrator experience for building flexible course structures.

## Features

- **xAPI-compliant learning** – capture every learning interaction as an xAPI statement and store it in Neon for auditable compliance records.
- **Interactive course player** – learners progress through modular lessons with multimedia support and automated xAPI statement emission.
- **Learner dashboard** – monitor completion, scores, and recent statements with executive-ready visualisations.
- **Course catalog** – discover available programmes with rich metadata and filters.
- **Admin course builder** – create, edit, and delete courses, modules, and lessons with dynamic form controls.

## Tech Stack

- [Next.js 14](https://nextjs.org/) with the App Router
- [Prisma](https://www.prisma.io/) ORM targeting Neon PostgreSQL
- Tailwind CSS for theming aligned to the corporate style guide
- TypeScript for end-to-end typing

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the example file and supply your Neon connection string:

   ```bash
   cp .env.example .env
   ```

   Update `DATABASE_URL` to match your Neon project. Ensure `sslmode=require` remains set for secure connections.

3. **Generate the Prisma client**

   ```bash
   npx prisma generate
   ```

4. **Apply migrations**

   Adjust the Prisma schema as required and run migrations to create the database structure:

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Access the application at [http://localhost:3000](http://localhost:3000).

## xAPI Statement Flow

Client-side interactions emit xAPI statements through `recordStatement` and post to `/api/xapi`. The API validates each statement, associates it with a learner/course enrolment, persists it to the database, and updates progress metrics for dashboards.

## Neon Configuration Tips

- Create a dedicated **Neon branch** for development and copy the connection string into `.env`.
- Enable **connection pooling** if expecting high traffic; Prisma works seamlessly with pooled Neon URLs.
- Use Prisma Studio (`npx prisma studio`) to inspect statements, courses, and enrolments while testing.

## Scripts

- `npm run dev` – start the Next.js dev server
- `npm run build` – compile for production
- `npm run start` – run the production build
- `npm run prisma:generate` – regenerate Prisma client
- `npm run prisma:migrate` – create and apply migrations during development

## License

This project is released under the [MIT License](./LICENSE).
