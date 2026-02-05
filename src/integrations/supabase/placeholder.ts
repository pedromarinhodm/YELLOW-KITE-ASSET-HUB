/**
 * SUPABASE INTEGRATION PLACEHOLDER
 * 
 * This file serves as a placeholder for future Supabase integration.
 * When ready to migrate from mock data to a real database:
 * 
 * 1. Install Supabase client: @supabase/supabase-js
 * 2. Create a Supabase project at https://supabase.com
 * 3. Set up environment variables:
 *    - VITE_SUPABASE_URL
 *    - VITE_SUPABASE_ANON_KEY
 * 
 * Database Schema (suggested):
 * 
 * CREATE TABLE equipments (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   serial_number TEXT UNIQUE NOT NULL,
 *   purchase_value DECIMAL(10,2) NOT NULL,
 *   purchase_date DATE NOT NULL,
 *   status TEXT NOT NULL DEFAULT 'available',
 *   image_url TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE employees (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name TEXT NOT NULL,
 *   role TEXT NOT NULL,
 *   email TEXT UNIQUE NOT NULL,
 *   department TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * CREATE TABLE allocations (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   employee_id UUID REFERENCES employees(id),
 *   equipment_id UUID REFERENCES equipments(id),
 *   allocated_at TIMESTAMPTZ DEFAULT NOW(),
 *   returned_at TIMESTAMPTZ,
 *   notes TEXT,
 *   type TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey);
};
