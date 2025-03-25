export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight: number | null;
          chest: number | null;
          waist: number | null;
          hips: number | null;
          left_arm: number | null;
          right_arm: number | null;
          left_thigh: number | null;
          right_thigh: number | null;
          left_calf: number | null;
          right_calf: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          weight?: number | null;
          chest?: number | null;
          waist?: number | null;
          hips?: number | null;
          left_arm?: number | null;
          right_arm?: number | null;
          left_thigh?: number | null;
          right_thigh?: number | null;
          left_calf?: number | null;
          right_calf?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          weight?: number | null;
          chest?: number | null;
          waist?: number | null;
          hips?: number | null;
          left_arm?: number | null;
          right_arm?: number | null;
          left_thigh?: number | null;
          right_thigh?: number | null;
          left_calf?: number | null;
          right_calf?: number | null;
          created_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string;
          muscle_group: MuscleGroup;
          is_public: boolean;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          muscle_group: MuscleGroup;
          is_public?: boolean;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          muscle_group?: MuscleGroup;
          is_public?: boolean;
          user_id?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          is_premium: boolean;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
        };
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          workout_exercise_id: string;
          date: string;
          weight: number;
          reps: number;
          sets: number;
          rpe: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_exercise_id: string;
          date: string;
          weight: number;
          reps: number;
          sets: number;
          rpe?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_exercise_id?: string;
          date?: string;
          weight?: number;
          reps?: number;
          sets?: number;
          rpe?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      shared_workouts: {
        Row: {
          id: string;
          workout_id: string;
          shared_by: string;
          shared_with: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          shared_by: string;
          shared_with: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          shared_by?: string;
          shared_with?: string;
          created_at?: string;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          rest_time: number | null;
          order_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          rest_time?: number | null;
          order_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          sets?: number;
          reps?: number;
          rest_time?: number | null;
          order_number?: number;
          created_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          day_of_week: DayOfWeek;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          day_of_week: DayOfWeek;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          day_of_week?: DayOfWeek;
          created_at?: string;
          is_active?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      day_of_week: DayOfWeek;
      muscle_group: MuscleGroup;
    };
  };
}

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "glutes"
  | "abs"
  | "cardio"
  | "full_body"
  | "other";
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
