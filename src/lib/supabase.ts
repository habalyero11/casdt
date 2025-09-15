import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      barangays: {
        Row: {
          id: string;
          name: string;
          municipality: string;
          province: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          municipality: string;
          province: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          municipality?: string;
          province?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'barangay';
          barangay_id: string | null;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'admin' | 'barangay';
          barangay_id?: string | null;
          full_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'barangay';
          barangay_id?: string | null;
          full_name?: string;
          created_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          barangay_id: string;
          created_by: string;
          client_name: string;
          client_address: string;
          date_of_birth: string;
          number_of_children: number;
          civil_status: string;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          barangay_id: string;
          created_by: string;
          client_name: string;
          client_address: string;
          date_of_birth: string;
          number_of_children?: number;
          civil_status?: string;
          [key: string]: any;
        };
        Update: {
          id?: string;
          barangay_id?: string;
          created_by?: string;
          client_name?: string;
          client_address?: string;
          date_of_birth?: string;
          number_of_children?: number;
          civil_status?: string;
          [key: string]: any;
        };
      };
    };
  };
};