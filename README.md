# 🎓 MY B.TECH STUDY HUB
### Personal 4-Year Engineering Knowledge Base & Study Management System

A full-stack, personal study portal designed to organize all your study materials, lecture notes, question banks, presentation slides, and syllabi for all **FOUR YEARS** of B.Tech engineering.

---

## 🌟 Key Features

1. **Academic Year & Semester Navigation**:
   - **4 Large Year Hubs**: 1st Year, 2nd Year, 3rd Year, 4th Year.
   - **8 Semesters**: 
     - 1st Year: Semester 1 & Semester 2
     - 2nd Year: Semester 3 & Semester 4 (MRV-25 Regulation active)
     - 3rd Year: Semester 5 & Semester 6
     - 4th Year: Semester 7 & Semester 8
2. **Semester Exam Sections**:
   - **Three Main Exam Sections**: `[ MID-1 ]`, `[ MID-2 ]`, `[ SEM-X ]`.
   - **Flexible Custom Categories**: `[ + ADD CATEGORY ]` for Presentation, Records, Assignments, Lab Manuals, Previous Papers, etc.
3. **Dynamic Subject-Wise Organization**:
   - Inside each category, materials are organized **subject-wise**.
   - `[ + ADD SUBJECT ]` button allows creating new subjects dynamically without touching any code.
4. **Structured & Editable Syllabus Engine**:
   - Stored as structured relational data: **Units & Topics**.
   - `[ + ADD UNIT ]`, `[ + ADD TOPIC ]`, `[ EDIT ]`, `[ DELETE ]`, `[ SAVE SYLLABUS ]`.
   - `[ IMPORT SYLLABUS ]` lets you paste syllabus text for automated structuring.
5. **Direct File Upload & All Format Support**:
   - `[ + ADD FILE ]` button inside every subject.
   - Supports: **PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, CSV, TXT, Images (JPG, PNG, WEBP), Video (MP4, WEBM), Audio (MP3), ZIP, RAR**, etc.
6. **File Actions & Previews**:
   - `[ OPEN ]`: In-browser preview for PDFs, Images (with zoom), Videos, Audio, and Text notes.
   - `[ DOWNLOAD ]`: Direct download of original files.
   - `[ RENAME ]`: Fast renaming in database and UI.
   - `[ DELETE ]`: Safe deletion.
   - `[ ⭐ FAVORITE ]`: Star important documents for instant access on the **Favorites** page.
7. **Powerful Global Search Engine**:
   - Search bar in the top navigation and homepage.
   - Searches **Subject Names, File Names, Units, Topics, Categories, Semesters, and Years**.
   - **Full-Text In-Content Search**: Extracts and indexes text from PDFs, Word DOCX documents, Markdown, and Text files so searching for concepts (e.g. "heuristics", "Bayes Theorem", "Newton laws") finds the exact document even if the keyword isn't in the filename!
   - Live Filters: Year, Semester, Category, Subject, and File Type.
8. **Preserved Existing Files**:
   - All existing materials from `D:\SEM-2 ---MID-2`, `D:\`, and downloads were safely migrated into the organized structure while strictly preserving the original files.
9. **Admin Authentication & Access Control**:
   - **Public Access**: Any visitor can browse, view subjects, read syllabi, search, preview, and download files.
   - **Admin Only**: Only logged-in admin can upload files, delete files, rename files, create subjects/categories, or edit syllabi.
   - **Credentials**: Admin ID: `manishramagiri09@gmail.com`
10. **Modern Glassmorphic UI**:
   - Responsive dark and light theme toggle.
   - Clickable breadcrumbs on every deep level.
   - Real URL routing (`/year/:id/semester/:semId/:category/:subject`).

---

## 🚀 How to Run

### Start Both Backend & Frontend Together:
```powershell
cd d:\NIAT_FOUR_YEARS
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### Or Run Separately:
```powershell
# Terminal 1 - Backend
node server/index.js

# Terminal 2 - Frontend
npm --prefix client run dev
```

---

## 📁 Storage Architecture

Uploaded materials are organized cleanly on disk:
```
study-materials/
  ├── year-1/
  │    ├── semester-1/
  │    │    ├── mid-1/
  │    │    │    └── mathematics-i/
  │    │    │         └── 1728123456-Calculus_Notes.pdf
  │    │    ├── mid-2/
  │    │    └── sem-1/
  │    └── semester-2/
  ├── year-2/
  │    ├── semester-3/
  │    │    ├── mid-1/
  │    │    ├── mid-2/
  │    │    │    ├── backend-development/
  │    │    │    ├── design-and-analysis-of-algorithms/
  │    │    │    ├── digital-electronics/
  │    │    │    └── probability-and-statistics/
  │    │    └── presentation/
  │    └── semester-4/
  ├── year-3/
  └── year-4/
```

Database is maintained in SQLite: `study_hub.db`
