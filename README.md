# Tire Measurement Application

A Next.js application for capturing and analyzing tire measurements through video processing and metadata collection.

## Features

- Video upload and frame extraction
- Tire measurement data collection
- Metadata capture including:
  - Tire position (FL, FR, RL, RR)
  - Tread depth measurements (left, center, right)
  - Tire specifications (brand, model, size)
  - Vehicle information
  - Environmental conditions
  - Damage assessment

## Setup

1. Clone the repository:
2. bash
git clone https://github.com/yourusername/tire-data.git
cd tire-data


2. Install dependencies:

bash npm install


3. Start the development server:

   npm run dev

   
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database

The application uses SQLite for data storage. The database file (`tire-data.db`) is automatically created when the application starts.

## Environment Variables

No environment variables are required for basic setup.

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- SQLite (better-sqlite3)
- Tailwind CSS

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
