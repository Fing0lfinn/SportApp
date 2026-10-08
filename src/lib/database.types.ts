// Supabase şemasından üretildi (generate_typescript_types). Şema değişince yeniden üret.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id?: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocks_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocks_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      body_weights: {
        Row: {
          created_at: string;
          id: string;
          measured_on: string;
          user_id: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          measured_on: string;
          user_id?: string;
          weight: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          measured_on?: string;
          user_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'body_weights_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      health_settings: {
        Row: {
          activity: string | null;
          birth_year: number | null;
          favorites: Json;
          goal: string | null;
          height_cm: number | null;
          kcal_target: number | null;
          pace: number | null;
          protein_target: number | null;
          sex: string | null;
          target_weight: number | null;
          updated_at: string;
          user_id: string;
          water_target: number | null;
        };
        Insert: {
          activity?: string | null;
          birth_year?: number | null;
          favorites?: Json;
          goal?: string | null;
          height_cm?: number | null;
          kcal_target?: number | null;
          pace?: number | null;
          protein_target?: number | null;
          sex?: string | null;
          target_weight?: number | null;
          updated_at?: string;
          user_id?: string;
          water_target?: number | null;
        };
        Update: {
          activity?: string | null;
          birth_year?: number | null;
          favorites?: Json;
          goal?: string | null;
          height_cm?: number | null;
          kcal_target?: number | null;
          pace?: number | null;
          protein_target?: number | null;
          sex?: string | null;
          target_weight?: number | null;
          updated_at?: string;
          user_id?: string;
          water_target?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'health_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      meals: {
        Row: {
          carbs: number;
          created_at: string;
          eaten_on: string;
          fat: number;
          id: string;
          items: Json;
          kcal: number;
          name: string;
          protein: number;
          slot: string;
          user_id: string;
        };
        Insert: {
          carbs?: number;
          created_at?: string;
          eaten_on: string;
          fat?: number;
          id?: string;
          items?: Json;
          kcal?: number;
          name?: string;
          protein?: number;
          slot: string;
          user_id?: string;
        };
        Update: {
          carbs?: number;
          created_at?: string;
          eaten_on?: string;
          fat?: number;
          id?: string;
          items?: Json;
          kcal?: number;
          name?: string;
          protein?: number;
          slot?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          details: string;
          entry_id: string | null;
          id: string;
          reason: string;
          reported_id: string;
          reporter_id: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          details?: string;
          entry_id?: string | null;
          id?: string;
          reason: string;
          reported_id: string;
          reporter_id?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          details?: string;
          entry_id?: string | null;
          id?: string;
          reason?: string;
          reported_id?: string;
          reporter_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_entry_id_fkey';
            columns: ['entry_id'];
            isOneToOne: false;
            referencedRelation: 'entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_reported_id_fkey';
            columns: ['reported_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      water_logs: {
        Row: {
          created_at: string;
          drunk_on: string;
          id: string;
          ml: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          drunk_on: string;
          id?: string;
          ml: number;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          drunk_on?: string;
          id?: string;
          ml?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'water_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
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
      group_exercises: {
        Row: {
          distance: number;
          exercise: string;
          goal: number;
          group_id: string;
          name: string | null;
          per_hand: boolean;
          position: number;
          type: string;
        };
        Insert: {
          distance?: number;
          exercise: string;
          goal: number;
          group_id: string;
          name?: string | null;
          per_hand?: boolean;
          position?: number;
          type: string;
        };
        Update: {
          distance?: number;
          exercise?: string;
          goal?: number;
          group_id?: string;
          name?: string | null;
          per_hand?: boolean;
          position?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_exercises_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
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
          start_date: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invite_code: string;
          name: string;
          require_approval?: boolean;
          start_date?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invite_code?: string;
          name?: string;
          require_approval?: boolean;
          start_date?: string;
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
          locale: string;
          name: string;
          notify: Json;
          onboarded: boolean;
        };
        Insert: {
          body_weight?: number | null;
          color?: string;
          created_at?: string;
          id: string;
          locale?: string;
          name?: string;
          notify?: Json;
          onboarded?: boolean;
        };
        Update: {
          body_weight?: number | null;
          color?: string;
          created_at?: string;
          id?: string;
          locale?: string;
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
        Args: { p_name: string; p_start?: string; p_exercises?: Json };
        Returns: {
          created_at: string;
          created_by: string | null;
          id: string;
          invite_code: string;
          name: string;
          require_approval: boolean;
          start_date: string;
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
