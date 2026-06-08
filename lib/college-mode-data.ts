export type Risk = "green" | "amber" | "red" | "blue" | "grey";

export const collegeCommandSummary = [
  { label: "Total active courses", value: "7", detail: "B.Tech, MBA, Diploma, BBA, BCA, MCA, M.Tech" },
  { label: "Total departments", value: "16", detail: "Technical and management streams" },
  { label: "Total students", value: "3,420", detail: "Active batches" },
  { label: "Total faculty", value: "142", detail: "Including HODs" },
  { label: "Faculty present today", value: "128", detail: "6 on duty, 4 absent" },
  { label: "Student attendance today", value: "86%", detail: "4 batches below threshold" },
  { label: "Active academic batches", value: "28", detail: "Current year/semester" },
  { label: "Overall syllabus", value: "72%", detail: "Semester average" },
  { label: "Final exam readiness", value: "Amber", detail: "Internal marks pending" },
  { label: "Fee pending amount", value: "Rs 42.8L", detail: "Rs 16.4L overdue" },
  { label: "Placement readiness", value: "68%", detail: "Final-year readiness" },
  { label: "Critical alerts", value: "9", detail: "Needs director review" },
];

export const collegeCourses = [
  { id: "btech", course: "B.Tech", type: "btech", departments: 7, batches: 14, students: 1840, faculty: 82, syllabus: 74, attendanceRisk: "3 batches", finalExam: "Amber", feePending: "Rs 22.4L", placement: "71%", alert: "amber" as Risk },
  { id: "mba", course: "MBA", type: "mba", departments: 5, batches: 4, students: 420, faculty: 24, syllabus: 78, attendanceRisk: "1 batch", finalExam: "Green", feePending: "Rs 8.1L", placement: "76%", alert: "green" as Risk },
  { id: "diploma", course: "Diploma", type: "diploma", departments: 3, batches: 6, students: 690, faculty: 28, syllabus: 66, attendanceRisk: "2 batches", finalExam: "Red", feePending: "Rs 10.3L", placement: "Industrial training 62%", alert: "red" as Risk },
  { id: "bca", course: "BCA", type: "bca", departments: 1, batches: 2, students: 240, faculty: 8, syllabus: 73, attendanceRisk: "Normal", finalExam: "Amber", feePending: "Rs 2.0L", placement: "64%", alert: "amber" as Risk },
];

export const collegeDepartments = [
  { course: "B.Tech", department: "CSE", hod: "Dr. Kavya Rao", students: 520, faculty: 22, syllabus: 78, lab: 72, internal: "In progress", finalExam: "Amber", placement: "76%", feePending: 38, alerts: 2, risk: "amber" as Risk },
  { course: "B.Tech", department: "ECE", hod: "Prof. Imran Ali", students: 360, faculty: 16, syllabus: 71, lab: 58, internal: "Delayed", finalExam: "Red", placement: "Core readiness 61%", feePending: 31, alerts: 3, risk: "red" as Risk },
  { course: "B.Tech", department: "Mechanical", hod: "Dr. S. Prakash", students: 310, faculty: 15, syllabus: 69, lab: 64, internal: "In progress", finalExam: "Amber", placement: "Workshop 67%", feePending: 22, alerts: 2, risk: "amber" as Risk },
  { course: "MBA", department: "Finance", hod: "Prof. Neha Shah", students: 110, faculty: 6, syllabus: 82, lab: 0, internal: "Completed", finalExam: "Green", placement: "81%", feePending: 8, alerts: 0, risk: "green" as Risk },
  { course: "MBA", department: "Marketing", hod: "Prof. Ramesh Iyer", students: 105, faculty: 5, syllabus: 76, lab: 0, internal: "In progress", finalExam: "Green", placement: "73%", feePending: 9, alerts: 1, risk: "green" as Risk },
  { course: "Diploma", department: "Mechanical", hod: "Mr. Naresh R", students: 240, faculty: 9, syllabus: 62, lab: 54, internal: "Delayed", finalExam: "Red", placement: "Training 58%", feePending: 29, alerts: 4, risk: "red" as Risk },
];

export const semesterProgress = [
  { batch: "B.Tech CSE 2023-2027 A", semester: "Sem 5", syllabus: 78, lab: 72, internal: "68%", attendanceRisk: "12 students", backlogRisk: "Placeholder", revision: "Started", facultyCompliance: "8/10" },
  { batch: "B.Tech ECE 2022-2026", semester: "Sem 7", syllabus: 69, lab: 58, internal: "54%", attendanceRisk: "18 students", backlogRisk: "Placeholder", revision: "Not started", facultyCompliance: "6/9" },
  { batch: "MBA 2025-2027", semester: "Sem 2", syllabus: 81, lab: 0, internal: "76%", attendanceRisk: "4 students", backlogRisk: "Placeholder", revision: "In progress", facultyCompliance: "7/7" },
  { batch: "Diploma Mechanical 2024-2027", semester: "Year 2", syllabus: 62, lab: 54, internal: "49%", attendanceRisk: "21 students", backlogRisk: "Placeholder", revision: "Not started", facultyCompliance: "5/8" },
];

export const collegeAlerts = [
  { title: "ECE practical exam readiness red", message: "Lab records and equipment verification are pending.", severity: "red" as Risk },
  { title: "Diploma Mechanical syllabus behind", message: "Workshop units are behind by more than 10%.", severity: "red" as Risk },
  { title: "Internal marks pending", message: "B.Tech Sem 7 internal marks not submitted.", severity: "amber" as Risk },
  { title: "Fee overdue above threshold", message: "Rs 16.4L overdue across final-year batches.", severity: "amber" as Risk },
  { title: "Accreditation evidence pending", message: "NAAC Criterion 3 evidence needs revision.", severity: "amber" as Risk },
  { title: "Placement readiness low", message: "Diploma industrial training completion below target.", severity: "amber" as Risk },
];

export const finalExamOverview = [
  { label: "Final exams scheduled", value: "12" },
  { label: "Starting within 30 days", value: "5" },
  { label: "Courses ready", value: "3" },
  { label: "Courses at risk", value: "2" },
  { label: "Internal marks pending", value: "7" },
  { label: "Practicals pending", value: "4" },
  { label: "Hall tickets blocked", value: "32" },
  { label: "Invigilation pending", value: "6" },
];

export const finalExamRows = [
  { course: "B.Tech", department: "ECE", semester: "Sem 7", dates: "10 Jun - 24 Jun", timetable: "Published", internal: "Delayed", practical: "Pending", hallTicket: "In progress", risk: "red" as Risk },
  { course: "B.Tech", department: "CSE", semester: "Sem 5", dates: "12 Jun - 26 Jun", timetable: "Published", internal: "In progress", practical: "In progress", hallTicket: "Issued", risk: "amber" as Risk },
  { course: "MBA", department: "Finance", semester: "Sem 2", dates: "18 Jun - 28 Jun", timetable: "Published", internal: "Submitted", practical: "Not applicable", hallTicket: "Issued", risk: "green" as Risk },
  { course: "Diploma", department: "Mechanical", semester: "Year 2", dates: "08 Jun - 20 Jun", timetable: "Drafted", internal: "Delayed", practical: "Delayed", hallTicket: "Blocked", risk: "red" as Risk },
];

export const examSubjectRows = [
  { subject: "Data Structures Lab", faculty: "Prof. Anil", date: "13 Jun", paper: "Not applicable", seating: "Prepared", invigilation: "Assigned", marks: "Pending", risk: "amber" as Risk },
  { subject: "Analog Circuits", faculty: "Prof. Sana", date: "11 Jun", paper: "Moderated", seating: "Pending", invigilation: "Pending", marks: "Delayed", risk: "red" as Risk },
  { subject: "Financial Management", faculty: "Prof. Neha", date: "19 Jun", paper: "Submitted", seating: "Verified", invigilation: "Confirmed", marks: "Not applicable", risk: "green" as Risk },
];

export const feeOverview = [
  { label: "Total fee demand", value: "Rs 8.4Cr" },
  { label: "Total collected", value: "Rs 7.1Cr" },
  { label: "Total pending", value: "Rs 1.3Cr" },
  { label: "Overdue amount", value: "Rs 42.8L" },
  { label: "Students pending", value: "318" },
  { label: "Overdue students", value: "94" },
  { label: "Scholarship pending", value: "36" },
  { label: "Concession pending", value: "21" },
];

export const feeRows = [
  { student: "Student A", admission: "BT23CSE041", course: "B.Tech", department: "CSE", batch: "2023-2027", category: "Tuition", total: "Rs 1,20,000", paid: "Rs 80,000", pending: "Rs 40,000", due: "05 Jun", status: "overdue", followup: "Call scheduled" },
  { student: "Student B", admission: "DP24ME028", course: "Diploma", department: "Mechanical", batch: "2024-2027", category: "Lab", total: "Rs 18,000", paid: "Rs 0", pending: "Rs 18,000", due: "29 May", status: "pending", followup: "WhatsApp sent" },
  { student: "Student C", admission: "MBA25FIN013", course: "MBA", department: "Finance", batch: "2025-2027", category: "Tuition", total: "Rs 1,75,000", paid: "Rs 1,25,000", pending: "Rs 50,000", due: "15 Jun", status: "partially_paid", followup: "Next call 02 Jun" },
];

export const feeCourseRows = [
  { course: "B.Tech", department: "CSE", batch: "2023-2027", students: 520, pending: "Rs 8.2L", overdue: "Rs 3.1L", highRisk: 12, hallTicketRisk: 7 },
  { course: "B.Tech", department: "ECE", batch: "2022-2026", students: 360, pending: "Rs 6.4L", overdue: "Rs 2.9L", highRisk: 16, hallTicketRisk: 10 },
  { course: "MBA", department: "Finance", batch: "2025-2027", students: 110, pending: "Rs 2.2L", overdue: "Rs 0.8L", highRisk: 4, hallTicketRisk: 1 },
  { course: "Diploma", department: "Mechanical", batch: "2024-2027", students: 240, pending: "Rs 5.5L", overdue: "Rs 3.3L", highRisk: 19, hallTicketRisk: 14 },
];

export const courseDetails: Record<string, {
  title: string;
  type: string;
  panels: { title: string; value: string; detail: string; risk: Risk }[];
}> = {
  btech: {
    title: "B.Tech Command Dashboard",
    type: "btech",
    panels: [
      { title: "Department-wise readiness", value: "72%", detail: "CSE safe, ECE needs attention", risk: "amber" },
      { title: "Lab completion", value: "65%", detail: "ECE and Mechanical labs behind", risk: "amber" },
      { title: "Placement readiness", value: "71%", detail: "Coding training needs push", risk: "amber" },
      { title: "Project/capstone", value: "68%", detail: "Final-year reviews pending", risk: "amber" },
    ],
  },
  mba: {
    title: "MBA Command Dashboard",
    type: "mba",
    panels: [
      { title: "Semester progress", value: "79%", detail: "Finance and Marketing on track", risk: "green" },
      { title: "Case study status", value: "74%", detail: "HR submissions pending", risk: "amber" },
      { title: "Summer internship", value: "69%", detail: "12 confirmations pending", risk: "amber" },
      { title: "GD/interview training", value: "82%", detail: "Corporate interaction scheduled", risk: "green" },
    ],
  },
  diploma: {
    title: "Diploma Command Dashboard",
    type: "diploma",
    panels: [
      { title: "Workshop completion", value: "54%", detail: "Mechanical workshop behind", risk: "red" },
      { title: "Practical readiness", value: "58%", detail: "Lab records pending", risk: "red" },
      { title: "Industrial training", value: "62%", detail: "Placement support needed", risk: "amber" },
      { title: "Final exam readiness", value: "Red", detail: "Internal and practical delays", risk: "red" },
    ],
  },
  bca: {
    title: "BCA Command Dashboard",
    type: "other",
    panels: [
      { title: "Batch progress", value: "73%", detail: "Semester average", risk: "amber" },
      { title: "Assessments", value: "70%", detail: "Marks entry in progress", risk: "amber" },
      { title: "Final exam readiness", value: "Amber", detail: "Timetable published", risk: "amber" },
      { title: "Reports", value: "Ready", detail: "Management snapshot available", risk: "blue" },
    ],
  },
};
