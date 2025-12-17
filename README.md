# Deetnuts

> Thousands of pages of public college, competitive exam, cutoffs data within PDFs - cleaned, formatted, and made accessible through sophisticated tables & graphs!

**TL;DR**: Large public college data, made accessible & simpler to use

🌐 **Live**: [deetnuts.com](https://deetnuts.com) | [deetnuts.site](https://deetnuts.site)

---

## 🎯 Features

### JoSAA Cutoffs Explorer

- Historical cutoff data for **IITs, NITs, IIITs, GFTIs**
- **467,000+** cutoff records across multiple years
- Round-by-round analysis with trend charts
- Branch comparison with difficulty indicators
- SEO-optimized for easy discovery

### MHT-CET Cutoffs

- Maharashtra CET college cutoffs
- Category and gender-based filtering
- Seat matrix visualization

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/kewonit/deetnuts

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Supabase (Auth & PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-database-url

# PocketBase (JoSAA Data)
NEXT_PUBLIC_POCKETBASE_URL=your-pocketbase-url
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

---

## 🏗️ Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| **Framework**  | Next.js 14 (App Router)          |
| **Language**   | TypeScript (Strict Mode)         |
| **Styling**    | Tailwind CSS + Neobrutalism UI   |
| **Auth**       | Supabase Auth                    |
| **Database**   | Supabase PostgreSQL + PocketBase |
| **Deployment** | Docker + Standalone Build        |

---

## 📁 Project Structure

```
deetnuts/
├── app/                    # Next.js App Router pages
│   ├── josaa/             # JoSAA cutoffs explorer
│   ├── mht-cet/           # MHT-CET cutoffs
│   └── api/               # API routes
├── components/            # React components
│   ├── josaa/            # JoSAA-specific components
│   └── ui/               # Shared UI components
├── lib/                   # Utilities & API clients
├── docs/                  # Documentation
├── scripts/              # Data import scripts
└── data/                 # Static data files
```

---

## 📚 Documentation

See the [docs/](./docs/) folder for detailed documentation:

- [JoSAA Implementation](./docs/JOSAA_IMPLEMENTATION.md)
- [Data Upload Guides](./docs/BATCH_UPLOAD_README.md)
- [Scripts Reference](./docs/scripts-readme.md)

---

## 🔒 Security

- Environment-based credential management
- PocketBase query sanitization
- Security headers (HSTS, XSS, CSRF protection)
- Input validation on all user inputs

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT License](./LICENSE)

---

## 🙏 Acknowledgements

Built with ❤️ for students navigating India's competitive exam system.

Special thanks to:

- All contributors who helped scrape and clean the data
- The open-source community for amazing tools
