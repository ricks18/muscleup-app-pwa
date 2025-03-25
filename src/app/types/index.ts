export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  isPremium: boolean;
  created_at: string;
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

export type ExerciseStatus = "pending" | "approved" | "rejected";

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_group: MuscleGroup;
  image_url?: string;
  video_url?: string;
  is_public: boolean;
  user_id?: string;
  added_by?: string;
  created_at: string;
  status?: ExerciseStatus;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Workout {
  id: string;
  name: string;
  user_id: string;
  day_of_week?: DayOfWeek;
  description?: string;
  exercises: WorkoutExercise[];
  is_active: boolean;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  rest_time: number; // seconds
  notes?: string;
  order_number: number;
}

export interface Progress {
  id: string;
  user_id: string;
  workout_exercise_id: string;
  date: string;
  weight: number; // kg
  reps: number;
  sets: number;
  notes?: string;
  rpe?: number; // Rating of Perceived Exertion (1-10)
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight?: number; // kg
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
  left_arm?: number; // cm
  right_arm?: number; // cm
  left_thigh?: number; // cm
  right_thigh?: number; // cm
  left_calf?: number; // cm
  right_calf?: number; // cm
  created_at: string;
  notes?: string;
}
