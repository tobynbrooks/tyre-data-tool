# Tire Measurement Application

A Next.js application for capturing tire videos and recording tire measurements and metadata.

## Features

- Video upload to Cloudinary (`tire-data/videos`)
- Automatic capture device detection from the video's metadata (e.g. `iPhone 12 Pro Max back camera 5.1mm f/1.6`)
- Tire measurement data collection:
  - Tire position (FL, FR, RL, RR, SP)
  - Tread depth measurements (left, center, right)
  - Tire specifications (brand, model, size, load index, speed rating)
  - Vehicle information
  - Environmental conditions
  - Damage assessment
- Measurements stored in Supabase (Postgres)

## How it works

1. You pick a video in the browser.
2. `/api/upload-video` reads the device model from the video with exiftool and uploads the video to Cloudinary.
3. You fill in the form and save. `/api/measurements` writes a row to `tire_measurements` in Supabase, including the Cloudinary video URL.

## Prerequisites

- Node.js
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (runs the local Supabase stack)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- A Cloudinary account

## Setup

All commands run from the `tire-data/` directory.

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/tobynbrooks/tyre-data-tool.git
   cd tyre-data-tool/tire-data
   npm install
   ```

2. Start the local Supabase stack (Docker must be running). The first run also creates the tables from `supabase/migrations`:

   ```bash
   supabase start
   ```

3. Create `.env.local`:

   ```bash
   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Supabase Postgres (local)
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

The local Supabase stack must be running whenever you use the app, otherwise saving a measurement fails. Stop it with `supabase stop`.

## Database

Data is stored in Supabase Postgres. The schema lives in `supabase/migrations/` and has two tables:

- `tire_measurements`: one row per tire, including the Cloudinary video URL (`original_video_url`) and capture device (`measurement_device`).
- `frame_images`: frame image URLs from older uploads. The app no longer writes to this table; it is kept so historical data is not lost.

Row level security is enabled with no policies, so only the server (via `DATABASE_URL` or the secret key) can read or write.

### Local Supabase

This project uses non-default ports (`5543x`) so it can run alongside other local Supabase projects.

| Service  | URL                                                       |
| -------- | --------------------------------------------------------- |
| Studio   | http://127.0.0.1:55433                                    |
| API      | http://127.0.0.1:55431                                    |
| Database | `postgresql://postgres:postgres@127.0.0.1:55432/postgres` |

Run `supabase status` to see the local API keys.

Useful commands:

```bash
supabase start      # start the stack
supabase stop       # stop the stack (data is kept)
supabase db reset   # wipe the local database and re-run migrations
```

### Importing the legacy SQLite data

The app previously stored data in SQLite (`tire-data.db`). That file is kept as a backup but is no longer written to. To copy it into an empty Supabase database:

```bash
npm run db:import-sqlite                                        # local Supabase
DATABASE_URL="postgresql://..." npm run db:import-sqlite        # any other Postgres
```

The import runs in a single transaction, keeps the original ids, and refuses to run if the target tables already contain data.

### Moving to Supabase cloud

1. Create a project at [supabase.com](https://supabase.com).
2. Link it and create the tables:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. Copy the data across from the local Supabase database (`supabase db dump --local --data-only`). Do not import from `tire-data.db`: it stops at measurement 177 and is missing everything saved since the switch to Supabase.
4. Set `DATABASE_URL` in `.env.local` (and in your hosting environment) to the cloud connection string from the Supabase dashboard (Project Settings, Database).

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Supabase (Postgres) via [`postgres`](https://github.com/porsager/postgres)
- Cloudinary (video storage)
- exiftool-vendored (video metadata)
- Tailwind CSS

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
