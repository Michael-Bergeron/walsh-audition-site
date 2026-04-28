"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button 
      onClick={() => signIn("google")} 
      style={{
        padding: '0.75rem 2rem',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)' }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)' }}
    >
      Sign In with Google
    </button>
  );
}
