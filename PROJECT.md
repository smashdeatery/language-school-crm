# Language School CRM — Project Summary

## What This Is
A web-based CRM replacing Google Sheets (Klassenbuch format) for a language school.
Teachers log in, mark attendance per session, track student info, and manage courses.

## Live URLs
- **App**: deployed on Vercel (check your Vercel dashboard)
- **Database**: Supabase (cloud — shared between all machines)
- **Repo**: https://github.com/smashdeatery/language-school-crm

---

## Tech Stack
| Tool | Version | Notes |
|---|---|---|
| Next.js | 16.1.6 | App Router, TypeScript |
| React | 19 | |
| Supabase | @supabase/ssr v0.9.0 | Hosted PostgreSQL + Auth |
| Tailwind CSS | v4 | CSS variables config |
| date-fns | v4 | European date formatting DD.MM.YYYY |
| lucide-react | latest | Icons |

---

## Getting Started on a New Machine

### 1. Clone and install
```bash
git clone https://github.com/smashdeatery/language-school-crm.git
cd language-school-crm
npm install
```

### 2. Create `.env.local` in project root
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Get these from: Supabase dashboard → Project Settings → API

### 3. Run dev server
```bash
npm run dev
```
Open http://localhost:3000 — log in with your Supabase auth credentials.

> **Mac note**: If login fails with "failed to fetch", make sure `.env.local` exists and restart the dev server after creating it.

> **Windows note**: If you run out of memory, use:
> `NODE_OPTIONS="--max-old-space-size=4096" npm run dev`

---

## Database Schema (Supabase)

### Enums
```sql
course_level: A1.1 | A1.2 | A2.1 | A2.2 | B1.1 | B1.2 | B2.1 | B2.2 | C1 | C2
course_type: extensive | intensive | private
attendance_status: present | absent_unexcused | absent_excused | credit | special
enrollment_status: active | paused | dropped | completed
day_of_week: monday | tuesday | wednesday | thursday | friday | saturday | sunday
```

### Tables
| Table | Key Columns |
|---|---|
| `teachers` | id, name, color (hex), is_active |
| `courses` | id, name, level, type, total_sessions, duration_weeks, schedule_days[], schedule_time, start_date, materials, is_active |
| `sessions` | id, course_id, session_number, session_date, teacher_id, topic, content_notes, homework, notes |
| `students` | id, name (legacy), first_name, last_name, company, customer_type, date_of_birth, email, mobile, phone (legacy), address, plz, city, notes, is_active |
| `enrollments` | id, student_id, course_id, status, ue_balance (int), payment_notes, enrolled_at |
| `attendance` | id, session_id, student_id, status (enum), note |

### Unique constraints
- `sessions`: `(course_id, session_number)`
- `enrollments`: `(student_id, course_id)`
- `attendance`: `(session_id, student_id)`

### RLS
Enabled on all tables. Policy: authenticated users have full read/write access.

---

## File Structure

```
src/
├── actions/                  # Server actions (Supabase calls)
│   ├── attendance.ts         # upsertAttendance, updateAttendanceNote, getStudentAttendanceStats
│   ├── courses.ts            # getCourses, createCourse (auto-generates sessions)
│   ├── sessions.ts           # getSession, updateSession, getSessionAttendance
│   ├── students.ts           # getStudents, createStudent, updateStudent, enrollStudent
│   └── teachers.ts           # getTeachers, createTeacher, updateTeacher, deleteTeacher
│
├── app/
│   ├── page.tsx              # Dashboard: stats + today's sessions + active courses
│   ├── login/page.tsx        # Login form (Supabase signInWithPassword)
│   ├── courses/
│   │   ├── page.tsx          # Course list grouped Active/Inactive (server component)
│   │   ├── new/page.tsx      # Create course form with day-of-week toggles + session preview
│   │   └── [id]/
│   │       ├── page.tsx      # Course overview: enrolled students, next session CTA, past sessions
│   │       └── sessions/[sid]/page.tsx  # ★ Main teacher view: attendance + session info
│   ├── students/
│   │   ├── page.tsx          # Student list with search (name/email/company)
│   │   └── [id]/page.tsx     # Student profile: contact info, active/past courses, UE balance
│   └── teachers/
│       └── page.tsx          # Teachers list with color picker
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx      # Sidebar + main content wrapper
│   │   └── Sidebar.tsx       # Dark slate sidebar, nav links
│   └── ui/
│       ├── button.tsx        # variants: primary, secondary, destructive, ghost, outline
│       ├── badge.tsx         # variants: default, success, warning, danger, info, outline
│       ├── card.tsx          # Card, CardHeader, CardTitle, CardContent, CardFooter
│       ├── dialog.tsx        # Modal (Escape + backdrop to close)
│       ├── input.tsx         # With label + error
│       ├── textarea.tsx      # With label + error
│       └── select.tsx        # With options array prop
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # createBrowserClient() for client components
│   │   └── server.ts         # createServerClient() with cookie handling
│   ├── utils.ts              # cn() helper (clsx + tailwind-merge)
│   └── utils/
│       ├── session-generator.ts    # generateSessionDates(startDate, days[], total) → Date[]
│       └── attendance-helpers.ts   # cycleStatus, getStatusLabel, getStatusIcon, getStatusColor
│
└── types/
    └── database.ts           # TypeScript interfaces: Teacher, Course, Session, Student, Enrollment, Attendance
```

---

## Key Patterns

### Student name display (legacy + new fields)
```typescript
function fullName(s: Student) {
  return [s.first_name, s.last_name].filter(Boolean).join(' ') || s.name || '—'
}
```

### Supabase join normalisation (student may return as array or object)
```typescript
student: Array.isArray(row.student) ? row.student[0] : row.student
```

### Soft deletes
Students and teachers are never hard-deleted. Set `is_active: false` to hide them.

### Attendance cycling
Tapping a student on the session page cycles: `null → present → absent_unexcused → absent_excused → credit → null`

---

## Pages Overview

| Page | What it does |
|---|---|
| `/` | Dashboard: today's sessions, active courses count, student/teacher count |
| `/courses` | List all courses grouped by active/inactive |
| `/courses/new` | Create a course — auto-generates all session dates |
| `/courses/[id]` | Course detail: student chips, next session CTA, past sessions collapsible |
| `/courses/[id]/sessions/[sid]` | **Main teacher view** — mark attendance, edit session info |
| `/students` | Student list with search |
| `/students/[id]` | Student profile with all fields, enrolled courses, UE balance |
| `/teachers` | Teacher list with color assignment |

---

## What's Done
- [x] Auth (login/logout, middleware protecting all routes)
- [x] Teachers CRUD with color picker
- [x] Courses: create with session auto-generation, list, detail
- [x] Sessions: detail page with attendance tap-to-toggle + notes
- [x] Students: list, profile, add/edit with full field set, soft delete
- [x] Enrollments: enroll student in course, UE balance editing
- [x] Dashboard with today's sessions

## What Could Be Next
- [ ] Edit course details (currently no edit form for existing courses)
- [ ] Student attendance statistics (% attended per course)
- [ ] Payment tracking / UE history log
- [ ] Dashboard improvements (upcoming sessions this week)
- [ ] Data import from CSV/Google Sheets
- [ ] Vercel deployment setup
