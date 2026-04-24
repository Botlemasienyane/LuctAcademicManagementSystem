# LUCT AMS — Academic Monitoring System
### Mobile Device Programming (BIMP2210) — Assignment 2

> Limkokwing University of Creative Technology, Lesotho  
> Expo SDK 54 · React Native · Role-Based Routing

---

## 📱 Overview

LUCT AMS is a fully functional mobile application for academic monitoring and lecturer reporting at LUCT. It supports 5 distinct roles, real page routing, and uses actual data from faculty structure documents.

**Academic Hierarchy:**
```
FMG  →  PL  →  PRL  →  Lecturers  →  Students
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo Go app on your phone (iOS/Android)

### Install & Run

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Scan the QR code with Expo Go
```

---

## 🔐 Demo Login Accounts

| Role      | Email                                      | Password    |
|-----------|--------------------------------------------|-------------|
| **FMG**   | diana.moopisa@limkokwing.ac.ls             | fmg1234     |
| **FMG**   | molemo.tsoeu@limkokwing.ac.ls              | fmg1234     |
| **PL**    | kapela.morutwa@limkokwing.ac.ls            | pl1234      |
| **PL**    | tsietsi.matjele@limkokwing.ac.ls           | pl1234      |
| **PRL**   | reauboka.mphale@limkokwing.ac.ls           | prl1234     |
| **PRL**   | mpotla.nthunya@limkokwing.ac.ls            | prl1234     |
| **PRL**   | khauhelo.mahlakeng@limkokwing.ac.ls        | prl1234     |
| **Lecturer** | tsekiso.thokoana@limkokwing.ac.ls       | lec1234     |
| **Lecturer** | thato.makheka@limkokwing.ac.ls          | lec1234     |
| **Student**  | student@luct.ac.ls                      | student123  |

> All accounts also visible in the demo panel on the login screen.

---

## 🗺️ Screens & Navigation

| Screen               | Route             | Description                                    |
|----------------------|-------------------|------------------------------------------------|
| LoginScreen          | `/Login`          | Role-based login + demo accounts + register    |
| HomeScreen           | `/Home`           | Role-scoped dashboard with stats & quick links |
| FacultiesScreen      | `/Faculties`      | All 6 LUCT faculties (FMG view)               |
| FacultyDetailScreen  | `/FacultyDetail`  | Hierarchy, programmes, staff per faculty       |
| ProgrammeListScreen  | `/ProgrammeList`  | All programmes across faculties               |
| ProgrammeDetailScreen| `/ProgrammeDetail`| Classes, courses, reports per programme        |
| StaffListScreen      | `/StaffList`      | All staff across faculties with role filter    |
| StaffDetailScreen    | `/StaffDetail`    | Individual staff profile + reports             |
| ClassesScreen        | `/Classes`        | Role-scoped class list with course shortcuts   |
| CoursesScreen        | `/Courses`        | Timetable-accurate course list by day          |
| LecturesScreen       | `/Lectures`       | Lecturer teaching schedule                     |
| ReportsScreen        | `/Reports`        | View/filter/export reports + PRL feedback      |
| ReportFormScreen     | `/ReportForm`     | Full 14-field lecturer reporting form          |
| MonitoringScreen     | `/Monitoring`     | Stats, attendance rates, progress bars         |
| AttendanceScreen     | `/Attendance`     | Record & view attendance per class             |
| RatingScreen         | `/Rating`         | Student rating system + averages               |

---

## 👥 Role Behaviour

### 🏛️ FMG (Faculty Management Group)
- Top-level overview of all 6 faculties
- Drill down: Faculty → Programmes → Classes → Reports
- View all staff across faculties
- Read-only access to all monitoring data

### 👔 PL (Programme Leader)
- View programmes under their faculty
- Add courses / assign lecturers
- View reports from PRLs
- Access to all classes and monitoring

### 🎯 PRL (Principal Lecturer)
- Logs in and lands on personal scoped view
- Sees all classes, courses under their stream
- Reviews lecturer reports and adds feedback
- Full monitoring with progress bars

### 👨‍🏫 Lecturer
- Sees only their assigned classes and courses
- Submits lecturer reporting form (14 fields)
- Views their submitted reports
- Records student attendance

### 🎓 Student
- Login / Register
- View attendance records for their class
- Rate lecturers (star rating + comment)
- View monitoring summary

---

## 📋 Lecturer Report Form Fields

1. Faculty Name
2. Class Name
3. Week of Reporting
4. Date of Lecture
5. Course Name
6. Course Code
7. Lecturer's Name
8. Actual Number of Students Present
9. Total Number of Registered Students *(auto-filled)*
10. Venue of the Class
11. Scheduled Lecture Time
12. Topic Taught
13. Learning Outcomes of the Topic
14. Lecturer's Recommendations

---

## 🎨 Theme System

The app uses the color palette from your brief:

| Token         | Light Mode  | Dark Mode   |
|---------------|-------------|-------------|
| Deep Cinder   | `#221B1A`   | Primary BG  |
| Pale Smoke    | `#F2F0F0`   | Primary BG  |
| Whisper White | `#E6E2E1`   | Secondary   |
| Ash Cloud     | `#D9D5D4`   | Borders     |
| Oyster Shell  | `#CCC7C6`   | Muted       |

**Toggle:** Switch icon in the top-right on Login and Home screens.

---

## 🗃️ Seed Data Sources

| Source                        | Used For                                              |
|-------------------------------|-------------------------------------------------------|
| `LUCT_FACULTY_STRUCTURES.pdf` | FMG, PL, PRL, YL names per faculty                  |
| `timetable-students-2026-02.pdf` | Lecturer names, courses, venues, times, classes   |
| `Assignment_2__2_.pdf`        | Reporting form fields, role definitions, modules     |

**Faculties seeded:** FICT, FDI, FBMG, FABE, FCMB, FCTH  
**Programmes seeded:** 15 programmes  
**Classes seeded:** 28 classes  
**Courses seeded:** 45 courses from timetable  
**Demo users:** 13 accounts across all 5 roles

---

## 📦 Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Framework  | React Native (Expo SDK 54)             |
| Navigation | @react-navigation/native-stack v7      |
| State      | React Context API (Auth, Data, Theme)  |
| Storage    | In-memory (AsyncStorage-ready)         |
| Styling    | StyleSheet + inline responsive styles  |
| Export     | CSV generation (Alert preview)         |

---

## 📁 Project Structure

```
luct-app/
├── App.js                          # Root entry point
├── babel.config.js
├── src/
│   ├── context/
│   │   ├── ThemeContext.js          # Light/dark theme + palette
│   │   ├── AuthContext.js           # Login/logout state
│   │   └── DataContext.js           # Reports, attendance, ratings
│   ├── data/
│   │   └── seedData.js              # All faculty/class/course data
│   ├── components/
│   │   └── UI.js                    # Card, Btn, Input, Badge, etc.
│   ├── navigation/
│   │   └── AppNavigator.js          # Stack navigator + auth gate
│   └── screens/
│       ├── LoginScreen.js
│       ├── HomeScreen.js
│       ├── FacultiesScreen.js
│       ├── FacultyDetailScreen.js
│       ├── StaffScreens.js          # ProgrammeList/Detail, StaffList/Detail
│       ├── ClassCourseScreens.js    # Classes, Courses, Lectures
│       ├── ReportScreens.js         # Reports, ReportForm, Monitoring
│       └── AttendanceRatingScreens.js
```

---

## ✅ Assignment Checklist

- [x] Student: Login/Register, Monitoring, Rating, Attendance
- [x] Lecturer: Classes, Reports, Monitoring, Rating, Attendance
- [x] PRL: Courses, Reports + Feedback, Monitoring, Rating, Classes
- [x] PL: Courses, Reports, Monitoring, Classes, Lectures, Rating
- [x] FMG: Top-level overview, drill-down, all staff & reports
- [x] 14-field Lecturer Reporting Form
- [x] Role-based dashboards
- [x] Real page routing (no fake scrolling pages)
- [x] Search in every module
- [x] Export reports to CSV
- [x] Attendance tracking
- [x] Rating/feedback system
- [x] Dark/light theme toggle
- [x] Real seeded data from PDFs
- [x] `Mr. Reauboka Mphale` logs in → sees FDI PRL scope
