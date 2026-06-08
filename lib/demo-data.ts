export const demoSchool = {
  name: "Demo Public School",
  address: "12 Knowledge Avenue",
  city: "Hyderabad",
  state: "Telangana",
  board: "State Board",
  establishedYear: 1998,
  contactEmail: "office@demopublicschool.edu",
  contactPhone: "+91 90000 12345",
  website: "www.demopublicschool.edu",
};

export const demoStats = [
  { label: "Overall syllabus progress", value: "76%", detail: "Latest class-wise average" },
  { label: "Weekly teacher updates", value: "8/10", detail: "2 teachers pending" },
  { label: "Overdue tasks", value: "4", detail: "2 high priority" },
  { label: "Upcoming events", value: "5", detail: "Next 30 days" },
  { label: "Events at risk", value: "2", detail: "Need owner follow-up" },
  { label: "Critical alerts", value: "3", detail: "Needs principal attention" },
];

export const demoSyllabus = [
  { className: "6A", subject: "Maths", teacher: "Meera Sharma", week: "20 May - 25 May", progress: 82, status: "on_track", next: "Fractions revision" },
  { className: "6B", subject: "English", teacher: "Fatima Khan", week: "20 May - 25 May", progress: 78, status: "on_track", next: "Grammar worksheet" },
  { className: "7A", subject: "Science", teacher: "Arjun Menon", week: "20 May - 25 May", progress: 64, status: "behind", next: "Lab activity completion" },
  { className: "8B", subject: "Social Studies", teacher: "Rohan Das", week: "20 May - 25 May", progress: 55, status: "behind", next: "Modern history unit" },
  { className: "9A", subject: "Hindi", teacher: "Priya Nair", week: "20 May - 25 May", progress: 91, status: "completed", next: "Assessment practice" },
  { className: "10A", subject: "Telugu", teacher: "Suresh Reddy", week: "20 May - 25 May", progress: 70, status: "on_track", next: "Board answer writing" },
];

export const demoTasks = [
  { title: "Submit Grade 10 revision plan", owner: "Fatima Khan", dueDate: "28 May", priority: "high", status: "in_progress", progress: 70 },
  { title: "Confirm lab safety audit", owner: "Arjun Menon", dueDate: "25 May", priority: "critical", status: "delayed", progress: 45 },
  { title: "Collect class teacher attendance reports", owner: "Meera Sharma", dueDate: "29 May", priority: "medium", status: "submitted", progress: 100 },
  { title: "Prepare inter-house debate schedule", owner: "Nikhil Verma", dueDate: "02 Jun", priority: "low", status: "assigned", progress: 10 },
  { title: "Update inspection files", owner: "Primary Coordinator", dueDate: "27 May", priority: "high", status: "in_progress", progress: 60 },
  { title: "Parent circular for PTM", owner: "Admin Office", dueDate: "30 May", priority: "medium", status: "completed", progress: 100 },
];

export const demoEvents = [
  { name: "Parent Teacher Meeting", date: "30 May", intensity: "medium", owner: "Primary Coordinator", status: "in_progress", readiness: 78 },
  { name: "Sports Day", date: "08 Jun", intensity: "high", owner: "Sports Coordinator", status: "at_risk", readiness: 52 },
  { name: "Unit Test", date: "12 Jun", intensity: "medium", owner: "Academic Coordinator", status: "planned", readiness: 66 },
  { name: "Science Exhibition", date: "20 Jun", intensity: "high", owner: "Science Department", status: "delayed", readiness: 44 },
  { name: "Morning Assembly Duty", date: "28 May", intensity: "low", owner: "House Teachers", status: "planned", readiness: 90 },
];

export const demoMilestones = [
  { event: "Sports Day", title: "Finalize event coordinators", owner: "Sports Coordinator", dueDate: "29 May", status: "in_progress" },
  { event: "Sports Day", title: "Ground and sound arrangement", owner: "Admin Office", dueDate: "31 May", status: "delayed" },
  { event: "Science Exhibition", title: "Student project list", owner: "Science Department", dueDate: "02 Jun", status: "blocked" },
  { event: "PTM", title: "Prepare parent circular", owner: "Primary Coordinator", dueDate: "28 May", status: "completed" },
  { event: "Unit Test", title: "Question paper review", owner: "Academic Coordinator", dueDate: "05 Jun", status: "not_started" },
];

export const demoInstitution = {
  vision: "To build confident learners with strong academic foundations and responsible citizenship.",
  mission: "Structured teaching, accountable follow-up, safe infrastructure and active parent communication.",
  totalStudents: 1240,
  totalTeachers: 68,
  totalAdminStaff: 18,
  totalClasses: 32,
  infrastructure: "Smart classrooms, science labs, library, playground, computer lab and first-aid room.",
  achievements: "District sports winners, science fair finalists, 96% board pass percentage.",
  specialPrograms: "Reading hour, remedial support, career guidance and weekly activity clubs.",
};

export const demoAttention = [
  "Grade 8B Social Studies is behind target.",
  "Lab safety audit is delayed and critical.",
  "Sports Day readiness is below 60%.",
  "Two teachers have not submitted this week's syllabus update.",
];

export const schoolModeStats = [
  { label: "Staff present", value: "82", detail: "6 absent, 4 on leave" },
  { label: "Student attendance", value: "91%", detail: "Classes 6 to 12" },
  { label: "Syllabus progress", value: "76%", detail: "Latest weekly average" },
  { label: "Substitution required", value: "5", detail: "Periods need allocation" },
  { label: "PTM readiness", value: "72%", detail: "Circulars and sheets pending" },
  { label: "Compliance alerts", value: "3", detail: "Safety and record updates" },
];

export const schoolBoardCommand = [
  { className: "Class 10", progress: "81%", risk: "Maths revision lag", action: "Add two revision periods" },
  { className: "Class 12", progress: "74%", risk: "Physics practical record delay", action: "HOD follow-up today" },
];

export const schoolOperations = [
  { area: "Upcoming school events", status: "Sports Day on 08 Jun", owner: "Events Coordinator" },
  { area: "Complaints", status: "4 open, 1 urgent", owner: "Admin Office" },
  { area: "Maintenance", status: "Lab exhaust repair pending", owner: "Operations" },
  { area: "Institution brief", status: "Ready for visitor print", owner: "Principal Office" },
];

export const collegeModeStats = [
  { label: "Faculty present", value: "54", detail: "3 absent, 6 on duty" },
  { label: "Student attendance", value: "84%", detail: "Across UG departments" },
  { label: "Semester progress", value: "69%", detail: "Current semester average" },
  { label: "Internal exam readiness", value: "78%", detail: "Question paper review pending" },
  { label: "Placement readiness", value: "63%", detail: "Drive pipeline active" },
  { label: "Accreditation readiness", value: "58%", detail: "Evidence files need updates" },
];

export const collegeDepartmentProgress = [
  { department: "Computer Science", semester: "Sem 4", progress: "72%", status: "On track" },
  { department: "Commerce", semester: "Sem 2", progress: "66%", status: "Needs HOD review" },
  { department: "Electronics", semester: "Sem 6", progress: "61%", status: "Practical backlog" },
  { department: "Management", semester: "Sem 3", progress: "79%", status: "On track" },
];

export const collegeOperations = [
  { area: "Placements", status: "3 drives planned, 42 eligible students pending profiles", owner: "Placement Cell" },
  { area: "Internships", status: "28 active, 9 pending confirmation", owner: "HODs" },
  { area: "Grievances", status: "5 open, 2 escalated", owner: "Student Affairs" },
  { area: "Management brief", status: "Monthly review snapshot ready", owner: "Director Office" },
];
