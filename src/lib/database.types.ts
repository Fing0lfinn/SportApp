// Supabase şemasından üretildi (generate_typescript_types). Şema değişince yeniden üret.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      entries: {
        Row: {
          created_at: string;
          distance: number;
          edited: boolean;
          exercise: string;
          id: string;
          is_start: boolean;
          performed_on: string;
          reps: number;
          user_id: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          distance?: number;
          edited?: boolean;
          exercise: string;
          id?: string;
          is_start?: boolean;
          performed_on?: string;
          reps?: number;
          user_id?: string;
          weight?: number;
        };
        Update: {
          created_at?: string;
          distance?: number;
          edited?: boolean;
          exercise?: string;
          id?: string;
          is_start?: boolean;
          performed_on?: string;
          reps?: number;
          user_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'entries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          joined_at: string;
          role: string;
          status: string;
          user_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string;
          role?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string;
          role?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          invite_code: string;
          name: string;
          require_approval: boolean;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invite_code: string;
          name: string;
          require_approval?: boolean;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invite_code?: string;
          name?: string;
          require_approval?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      likes: {
        Row: {
          created_at: string;
          entry_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entry_id: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          entry_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'likes_entry_id_fkey';
            columns: ['entry_id'];
            isOneToOne: false;
            referencedRelation: 'entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      push_tokens: {
        Row: {
          platform: string | null;
          token: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          platform?: string | null;
          token: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          platform?: string | null;
          token?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          body_weight: number | null;
          color: string;
          created_at: string;
          id: string;
          name: string;
          notify: Json;
          onboarded: boolean;
        };
        Insert: {
          body_weight?: number | null;
          color?: string;
          created_at?: string;
          id: string;
          name?: string;
          notify?: Json;
          onboarded?: boolean;
        };
        Update: {
          body_weight?: number | null;
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          notify?: Json;
          onboarded?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_account: { Args: never; Returns: undefined };
      create_group: {
        Args: { p_name: string };
        Returns: {
          created_at: string;
          created_by: string | null;
          id: string;
          invite_code: string;
          name: string;
          require_approval: boolean;
        };
        SetofOptions: {
          from: '*';
          to: 'groups';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      join_group: { Args: { p_code: string }; Returns: Json };
      regenerate_invite_code: { Args: { p_group: string }; Returns: string };
      register_push_token: { Args: { p_platform: string; p_token: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
