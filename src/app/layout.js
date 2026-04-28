import Link from 'next/link';
import './globals.css';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SignInButton from "@/components/SignInButton";

export const metadata = {
  title: 'Audition Judging',
  description: 'Premium audition judging system',
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  const allowedEmails = ["walshmsband@gmail.com", "mbergeron@gmail.com"];

  if (!session || !allowedEmails.includes(session.user?.email)) {
    return (
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet" />
        </head>
        <body>
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', background: '#0f172a', color: 'white', fontFamily: "'Outfit', sans-serif" }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              Walsh MS Auditions
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>Please sign in with the official director account to access the system.</p>
            <SignInButton />
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Link href="/" className="home-button-global">
          Home
        </Link>
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  );
}
