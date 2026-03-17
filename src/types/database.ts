export type CourseLevel = 'A1.1' | 'A1.2' | 'A2.1' | 'A2.2' | 'B1.1' | 'B1.2' | 'B2.1' | 'B2.2' | 'C1' | 'C2'
export type CourseType = 'extensive' | 'intensive' | 'private'
export type AttendanceStatus = 'present' | 'absent_unexcused' | 'absent_excused' | 'credit' | 'special'
export type EnrollmentStatus = 'active' | 'paused' | 'dropped' | 'completed'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface Teacher {
  id: string
  name: string
  color: string | null
  is_active: boolean
  created_at: string
}

export interface Course {
  id: string
  name: string
  level: CourseLevel
  type: CourseType
  total_sessions: number
  duration_weeks: number | null
  schedule_days: DayOfWeek[]
  schedule_time: string
  start_date: string
  materials: string | null
  is_active: boolean
  created_at: string
}

export interface Session {
  id: string
  course_id: string
  session_number: number
  session_date: string
  teacher_id: string | null
  topic: string | null
  content_notes: string | null
  homework: string | null
  notes: string | null
  created_at: string
}

export interface Student {
  id: string
  name: string           // legacy field — use first_name + last_name for new records
  first_name: string | null
  last_name: string | null
  company: string | null
  customer_type: string | null
  date_of_birth: string | null
  email: string | null
  mobile: string | null
  phone: string | null   // legacy — kept for old records
  address: string | null
  plz: string | null
  city: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  status: EnrollmentStatus
  ue_balance: number
  payment_notes: string | null
  enrolled_at: string
  left_at: string | null
  created_at: string
}

export interface Attendance {
  id: string
  session_id: string
  student_id: string
  status: AttendanceStatus | null
  note: string | null
  created_at: string
  updated_at: string
}

// Joined types for common queries
export interface SessionWithTeacher extends Session {
  teacher: Teacher | null
}

export interface EnrollmentWithStudent extends Enrollment {
  student: Student
}

export interface AttendanceWithStudent extends Attendance {
  student: Student
}

export interface CourseWithSessions extends Course {
  sessions: SessionWithTeacher[]
}
