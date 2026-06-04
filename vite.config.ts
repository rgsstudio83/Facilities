import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables from the OS/process and files
  const env = loadEnv(mode, process.cwd(), '');
  
  // Find all keys in process.env that contain "SUPABASE" (case-insensitive) to be extremely resilient
  const processKeys = Object.keys(process.env);
  const sysUrlKey = processKeys.find(k => k.toUpperCase() === 'VITE_SUPABASE_URL' || k.toUpperCase() === 'SUPABASE_URL');
  const sysAnonKey = processKeys.find(k => k.toUpperCase() === 'VITE_SUPABASE_ANON_KEY' || k.toUpperCase() === 'SUPABASE_ANON_KEY');

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || (sysUrlKey ? process.env[sysUrlKey] : '') || '';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || (sysAnonKey ? process.env[sysAnonKey] : '') || '';

  // Safe logging in console when starting server
  console.log('--- Vite Config DB Load ---', {
    hasUrl: !!supabaseUrl,
    urlSample: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'empty',
    hasKey: !!supabaseKey,
    keyLength: supabaseKey ? supabaseKey.length : 0,
    foundSysUrlKey: sysUrlKey,
    foundSysAnonKey: sysAnonKey
  });

  // If we found them, let's write them to a local .env file so they are persistently loaded by Vite in all modes
  if (supabaseUrl && supabaseKey) {
    const envContent = `VITE_SUPABASE_URL="${supabaseUrl}"\nVITE_SUPABASE_ANON_KEY="${supabaseKey}"\n`;
    try {
      fs.writeFileSync(path.resolve(process.cwd(), '.env'), envContent, 'utf-8');
      console.log('Successfully wrote .env file for Supabase integration.');
    } catch (e) {
      console.error('Error writing .env file:', e);
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey || ''),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
