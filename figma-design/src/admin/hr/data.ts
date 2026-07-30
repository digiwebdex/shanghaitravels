export type EmployeeStatus = "active" | "probation" | "notice" | "terminated" | "on_leave";
export type LeaveType = "annual" | "sick" | "emergency" | "maternity" | "paternity" | "unpaid" | "hajj";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type PayrollStatus = "draft" | "processing" | "approved" | "paid";
export type LoanStatus = "pending" | "approved" | "active" | "closed" | "rejected";
export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type RecruitStage = "applied" | "screening" | "interview_1" | "interview_2" | "offer" | "hired" | "rejected";

export interface Employee {
  id: string; empNo: string; name: string; photo?: string;
  designation: string; department: string; reportingTo: string;
  email: string; phone: string; nationality: string; passportNo: string;
  emiratesId: string; dob: string; gender: "male" | "female";
  joinedAt: string; contractType: "full_time" | "part_time" | "contract";
  contractExpiry?: string; status: EmployeeStatus;
  basicSalary: number; housing: number; transport: number; otherAllowances: number;
  bankAccount: string; bankName: string;
  annualLeaveBalance: number; sickLeaveBalance: number;
  documents: { name: string; uploaded: boolean; expiryDate?: string }[];
}

export interface AttendanceRecord {
  id: string; empId: string; empName: string; date: string;
  checkIn?: string; checkOut?: string; hoursWorked?: number;
  status: "present" | "absent" | "late" | "half_day" | "leave" | "holiday" | "weekend";
  notes?: string;
}

export interface LeaveRequest {
  id: string; empId: string; empName: string; department: string;
  type: LeaveType; startDate: string; endDate: string; days: number;
  reason: string; submittedAt: string; approvedBy?: string;
  status: LeaveStatus;
}

export interface PayrollRun {
  id: string; period: string; periodStart: string; periodEnd: string;
  employeeCount: number; grossPayroll: number; deductions: number; netPayroll: number;
  status: PayrollStatus;
  generatedAt?: string; approvedBy?: string; approvedAt?: string; paidAt?: string;
}

export interface PayrollEntry {
  id: string; runId: string; empId: string; empName: string; empNo: string; department: string;
  basicSalary: number; housing: number; transport: number; otherAllowances: number;
  overtime: number; grossPay: number;
  absentDeduction: number; loanDeduction: number; otherDeductions: number; totalDeductions: number;
  netPay: number;
  bankAccount: string; bankName: string;
  status: "pending" | "approved" | "paid";
}

export interface LoanAdvance {
  id: string; empId: string; empName: string; department: string;
  type: "loan" | "advance"; purpose: string; amount: number;
  approvedAmount?: number; installmentAED: number; installmentsTotal: number;
  installmentsPaid: number; outstandingBalance: number;
  requestedAt: string; approvedAt?: string; approvedBy?: string;
  status: LoanStatus;
}

export interface PerformanceReview {
  id: string; empId: string; empName: string; designation: string; department: string;
  reviewPeriod: string; reviewedBy: string;
  ratings: { category: string; score: ReviewRating; comment?: string }[];
  overallScore: number; overallRating: "exceptional" | "exceeds" | "meets" | "below" | "unsatisfactory";
  strengths: string[]; improvements: string[];
  nextReviewDate: string; status: "draft" | "submitted" | "acknowledged";
}

export interface JobPosting {
  id: string; title: string; department: string; location: string;
  type: "full_time" | "part_time" | "contract";
  salaryFrom: number; salaryTo: number; postedAt: string;
  stage: RecruitStage; applicantName: string; email: string;
  experience: string; nationality: string; notes?: string;
}

export interface TrainingRecord {
  id: string; empId: string; empName: string; department: string;
  courseName: string; provider: string; category: string;
  startDate: string; endDate: string; hours: number;
  cost: number; completionStatus: "scheduled" | "in_progress" | "completed" | "cancelled";
  certificate: boolean; score?: number;
}

// ── Employees ─────────────────────────────────────────────────────────────────
export const EMPLOYEES: Employee[] = [
  {
    id:"e1", empNo:"EMP-001", name:"Ayesha Rahman",        designation:"Operations Manager",    department:"Operations",  reportingTo:"Director",
    email:"ayesha.rahman@company.ae",    phone:"+971 50 111 2233", nationality:"Pakistani",  passportNo:"PK-AB123456", emiratesId:"784-1988-1234567-8", dob:"15 Mar 1988", gender:"female",
    joinedAt:"01 Jan 2018", contractType:"full_time", status:"active",
    basicSalary:18000, housing:4500, transport:1500, otherAllowances:1000,
    bankAccount:"AE070331234567890123456", bankName:"Emirates NBD",
    annualLeaveBalance:22, sickLeaveBalance:30,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"14 Apr 2027"},
      {name:"Emirates ID", uploaded:true, expiryDate:"14 Feb 2026"},
      {name:"Visa Copy", uploaded:true, expiryDate:"14 Feb 2026"},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:true},
    ],
  },
  {
    id:"e2", empNo:"EMP-002", name:"James Whitfield",       designation:"Senior Sales Executive", department:"Sales",       reportingTo:"Ayesha Rahman",
    email:"james.whitfield@company.ae",  phone:"+971 52 223 3344", nationality:"British",    passportNo:"GB-P2345678", emiratesId:"784-1985-2345678-9", dob:"22 Jun 1985", gender:"male",
    joinedAt:"15 Mar 2019", contractType:"full_time", status:"active",
    basicSalary:14000, housing:3500, transport:1000, otherAllowances:500,
    bankAccount:"AE070331234567890123457", bankName:"Abu Dhabi Commercial Bank",
    annualLeaveBalance:18, sickLeaveBalance:30,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"10 Jun 2028"},
      {name:"Emirates ID", uploaded:true, expiryDate:"10 May 2026"},
      {name:"Visa Copy", uploaded:true, expiryDate:"10 May 2026"},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:false},
    ],
  },
  {
    id:"e3", empNo:"EMP-003", name:"Lina Al-Sayed",         designation:"Finance Officer",         department:"Finance",     reportingTo:"Ayesha Rahman",
    email:"lina.alsayed@company.ae",     phone:"+971 55 334 4455", nationality:"Emirati",    passportNo:"UAE-33445566",emiratesId:"784-1992-3456789-0", dob:"08 Sep 1992", gender:"female",
    joinedAt:"01 Jun 2020", contractType:"full_time", status:"active",
    basicSalary:12000, housing:3000, transport:800, otherAllowances:200,
    bankAccount:"AE070331234567890123458", bankName:"Emirates NBD",
    annualLeaveBalance:14, sickLeaveBalance:25,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"25 Nov 2029"},
      {name:"Emirates ID", uploaded:true, expiryDate:"25 Nov 2027"},
      {name:"Visa Copy", uploaded:true},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:true},
    ],
  },
  {
    id:"e4", empNo:"EMP-004", name:"Omar Hassan",           designation:"Visa Consultant",        department:"Visa",        reportingTo:"Ayesha Rahman",
    email:"omar.hassan@company.ae",      phone:"+971 56 445 5566", nationality:"Egyptian",   passportNo:"EG-A1234567", emiratesId:"784-1990-4567890-1", dob:"03 Jan 1990", gender:"male",
    joinedAt:"01 Mar 2021", contractType:"full_time", status:"active",
    basicSalary:9000, housing:2500, transport:600, otherAllowances:0,
    bankAccount:"AE070331234567890123459", bankName:"First Abu Dhabi Bank",
    annualLeaveBalance:8, sickLeaveBalance:30,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"12 Feb 2026"},
      {name:"Emirates ID", uploaded:true, expiryDate:"12 Aug 2025"},
      {name:"Visa Copy", uploaded:true, expiryDate:"12 Aug 2025"},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:true},
    ],
  },
  {
    id:"e5", empNo:"EMP-005", name:"Priya Sharma",          designation:"Customer Relations",     department:"Operations",  reportingTo:"Ayesha Rahman",
    email:"priya.sharma@company.ae",     phone:"+971 58 556 6677", nationality:"Indian",     passportNo:"IN-L2345678", emiratesId:"784-1994-5678901-2", dob:"17 Jul 1994", gender:"female",
    joinedAt:"15 Sep 2021", contractType:"full_time", status:"probation", contractExpiry:"15 Mar 2025",
    basicSalary:7500, housing:2000, transport:500, otherAllowances:0,
    bankAccount:"AE070331234567890123460", bankName:"Mashreq Bank",
    annualLeaveBalance:5, sickLeaveBalance:15,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"20 Aug 2027"},
      {name:"Emirates ID", uploaded:false},
      {name:"Visa Copy", uploaded:true, expiryDate:"15 Dec 2025"},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:false},
    ],
  },
  {
    id:"e6", empNo:"EMP-006", name:"Khalid Al-Rashidi",     designation:"Ticketing Agent",        department:"Ticketing",   reportingTo:"James Whitfield",
    email:"khalid.alrashidi@company.ae", phone:"+971 50 667 7788", nationality:"Emirati",    passportNo:"UAE-44556677",emiratesId:"784-1995-6789012-3", dob:"29 Dec 1995", gender:"male",
    joinedAt:"01 Jan 2022", contractType:"full_time", status:"active",
    basicSalary:8000, housing:2000, transport:500, otherAllowances:0,
    bankAccount:"AE070331234567890123461", bankName:"Emirates NBD",
    annualLeaveBalance:12, sickLeaveBalance:30,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"05 Mar 2028"},
      {name:"Emirates ID", uploaded:true, expiryDate:"05 Mar 2027"},
      {name:"Visa Copy", uploaded:true},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:true},
    ],
  },
  {
    id:"e7", empNo:"EMP-007", name:"Sarah Mitchell",        designation:"Marketing Coordinator",  department:"Marketing",   reportingTo:"James Whitfield",
    email:"sarah.mitchell@company.ae",   phone:"+971 55 778 8899", nationality:"British",    passportNo:"GB-P3456789", emiratesId:"784-1993-7890123-4", dob:"14 Feb 1993", gender:"female",
    joinedAt:"01 Apr 2022", contractType:"full_time", status:"notice", contractExpiry:"31 Jan 2025",
    basicSalary:9500, housing:2500, transport:600, otherAllowances:0,
    bankAccount:"AE070331234567890123462", bankName:"RAKBANK",
    annualLeaveBalance:0, sickLeaveBalance:30,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"30 Sep 2026"},
      {name:"Emirates ID", uploaded:true, expiryDate:"31 Mar 2026"},
      {name:"Visa Copy", uploaded:true},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:true},
    ],
  },
  {
    id:"e8", empNo:"EMP-008", name:"Rashid Al-Mansouri",   designation:"IT Support Engineer",    department:"Technology",  reportingTo:"Ayesha Rahman",
    email:"rashid.almansouri@company.ae",phone:"+971 52 889 9900", nationality:"Emirati",    passportNo:"UAE-55667788",emiratesId:"784-1991-8901234-5", dob:"09 Oct 1991", gender:"male",
    joinedAt:"15 Jun 2020", contractType:"full_time", status:"active",
    basicSalary:11000, housing:2750, transport:750, otherAllowances:0,
    bankAccount:"AE070331234567890123463", bankName:"Abu Dhabi Islamic Bank",
    annualLeaveBalance:20, sickLeaveBalance:30,
    documents:[
      {name:"Passport Copy", uploaded:true, expiryDate:"22 Nov 2029"},
      {name:"Emirates ID", uploaded:true, expiryDate:"22 Nov 2026"},
      {name:"Visa Copy", uploaded:true},
      {name:"Labour Contract", uploaded:true},
      {name:"Education Certificate", uploaded:true},
    ],
  },
];

// ── Attendance ────────────────────────────────────────────────────────────────
export const ATTENDANCE_LOG: AttendanceRecord[] = [
  { id:"a1",  empId:"e1", empName:"Ayesha Rahman",    date:"13 Jan 2025", checkIn:"08:55", checkOut:"18:10", hoursWorked:9.25, status:"present" },
  { id:"a2",  empId:"e2", empName:"James Whitfield",  date:"13 Jan 2025", checkIn:"09:18", checkOut:"18:00", hoursWorked:8.7,  status:"late",    notes:"15 min late — traffic" },
  { id:"a3",  empId:"e3", empName:"Lina Al-Sayed",    date:"13 Jan 2025", checkIn:"08:58", checkOut:"17:55", hoursWorked:8.95, status:"present" },
  { id:"a4",  empId:"e4", empName:"Omar Hassan",      date:"13 Jan 2025",                                                     status:"absent",  notes:"No call" },
  { id:"a5",  empId:"e5", empName:"Priya Sharma",     date:"13 Jan 2025", checkIn:"09:00", checkOut:"13:00", hoursWorked:4,    status:"half_day" },
  { id:"a6",  empId:"e6", empName:"Khalid Al-Rashidi",date:"13 Jan 2025", checkIn:"08:50", checkOut:"18:00", hoursWorked:9.17, status:"present" },
  { id:"a7",  empId:"e7", empName:"Sarah Mitchell",   date:"13 Jan 2025",                                                     status:"leave"   },
  { id:"a8",  empId:"e8", empName:"Rashid Al-Mansouri",date:"13 Jan 2025",checkIn:"09:02", checkOut:"18:05", hoursWorked:9.05, status:"present" },
  { id:"a9",  empId:"e1", empName:"Ayesha Rahman",    date:"12 Jan 2025", checkIn:"09:00", checkOut:"18:00", hoursWorked:9,    status:"present" },
  { id:"a10", empId:"e4", empName:"Omar Hassan",      date:"12 Jan 2025", checkIn:"09:05", checkOut:"18:00", hoursWorked:8.92, status:"present" },
];

// attendance summary for calendar (day → status map for current employee)
export const ATTENDANCE_CALENDAR: Record<string, "present"|"absent"|"late"|"leave"|"holiday"|"weekend"> = {
  "2025-01-01":"holiday", "2025-01-02":"present","2025-01-03":"present","2025-01-04":"weekend","2025-01-05":"weekend",
  "2025-01-06":"present","2025-01-07":"present","2025-01-08":"present","2025-01-09":"leave","2025-01-10":"leave",
  "2025-01-11":"weekend","2025-01-12":"weekend","2025-01-13":"present","2025-01-14":"late","2025-01-15":"present",
  "2025-01-16":"present","2025-01-17":"present","2025-01-18":"weekend","2025-01-19":"weekend","2025-01-20":"present",
  "2025-01-21":"present","2025-01-22":"absent","2025-01-23":"present","2025-01-24":"present","2025-01-25":"weekend",
};

// ── Leave ─────────────────────────────────────────────────────────────────────
export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id:"lr1", empId:"e7", empName:"Sarah Mitchell",    department:"Marketing",   type:"annual",    startDate:"13 Jan 2025", endDate:"17 Jan 2025", days:5,  reason:"Annual vacation — UK visit",                     submittedAt:"08 Jan 2025", approvedBy:"James Whitfield", status:"approved"  },
  { id:"lr2", empId:"e4", empName:"Omar Hassan",       department:"Visa",        type:"sick",      startDate:"14 Jan 2025", endDate:"14 Jan 2025", days:1,  reason:"Fever — medical certificate attached",            submittedAt:"14 Jan 2025",                              status:"pending"   },
  { id:"lr3", empId:"e5", empName:"Priya Sharma",      department:"Operations",  type:"emergency", startDate:"13 Jan 2025", endDate:"13 Jan 2025", days:1,  reason:"Family emergency — half day only",                submittedAt:"13 Jan 2025",                              status:"approved"  },
  { id:"lr4", empId:"e2", empName:"James Whitfield",   department:"Sales",       type:"annual",    startDate:"01 Feb 2025", endDate:"07 Feb 2025", days:5,  reason:"Annual leave — trip to Singapore",                submittedAt:"10 Jan 2025",                              status:"pending"   },
  { id:"lr5", empId:"e1", empName:"Ayesha Rahman",     department:"Operations",  type:"annual",    startDate:"09 Jan 2025", endDate:"10 Jan 2025", days:2,  reason:"Personal errands",                               submittedAt:"05 Jan 2025", approvedBy:"Director",       status:"approved"  },
  { id:"lr6", empId:"e6", empName:"Khalid Al-Rashidi", department:"Ticketing",   type:"hajj",      startDate:"15 Mar 2025", endDate:"05 Apr 2025", days:22, reason:"Hajj pilgrimage — annual entitlement",            submittedAt:"10 Jan 2025",                              status:"pending"   },
];

// ── Payroll ───────────────────────────────────────────────────────────────────
export const PAYROLL_RUNS: PayrollRun[] = [
  { id:"pr1", period:"December 2024", periodStart:"01 Dec 2024", periodEnd:"31 Dec 2024", employeeCount:8, grossPayroll:225500, deductions:8200, netPayroll:217300, status:"paid",       generatedAt:"02 Jan 2025", approvedBy:"Director", approvedAt:"03 Jan 2025", paidAt:"05 Jan 2025" },
  { id:"pr2", period:"January 2025",  periodStart:"01 Jan 2025", periodEnd:"31 Jan 2025", employeeCount:8, grossPayroll:225500, deductions:6800, netPayroll:218700, status:"approved",   generatedAt:"01 Feb 2025", approvedBy:"Director", approvedAt:"02 Feb 2025" },
  { id:"pr3", period:"February 2025", periodStart:"01 Feb 2025", periodEnd:"28 Feb 2025", employeeCount:8, grossPayroll:221000, deductions:5200, netPayroll:215800, status:"draft" },
];

export const PAYROLL_ENTRIES: PayrollEntry[] = [
  { id:"pe1", runId:"pr2", empId:"e1", empName:"Ayesha Rahman",    empNo:"EMP-001", department:"Operations",  basicSalary:18000, housing:4500, transport:1500, otherAllowances:1000, overtime:0,    grossPay:25000, absentDeduction:0,    loanDeduction:0,    otherDeductions:0,   totalDeductions:0,    netPay:25000, bankAccount:"AE070331234567890123456", bankName:"Emirates NBD",             status:"approved" },
  { id:"pe2", runId:"pr2", empId:"e2", empName:"James Whitfield",  empNo:"EMP-002", department:"Sales",       basicSalary:14000, housing:3500, transport:1000, otherAllowances:500,  overtime:1400, grossPay:20400, absentDeduction:0,    loanDeduction:1000, otherDeductions:0,   totalDeductions:1000, netPay:19400, bankAccount:"AE070331234567890123457", bankName:"ADCB",                     status:"approved" },
  { id:"pe3", runId:"pr2", empId:"e3", empName:"Lina Al-Sayed",   empNo:"EMP-003", department:"Finance",     basicSalary:12000, housing:3000, transport:800,  otherAllowances:200,  overtime:0,    grossPay:16000, absentDeduction:0,    loanDeduction:0,    otherDeductions:0,   totalDeductions:0,    netPay:16000, bankAccount:"AE070331234567890123458", bankName:"Emirates NBD",             status:"approved" },
  { id:"pe4", runId:"pr2", empId:"e4", empName:"Omar Hassan",     empNo:"EMP-004", department:"Visa",        basicSalary:9000,  housing:2500, transport:600,  otherAllowances:0,    overtime:0,    grossPay:12100, absentDeduction:550,  loanDeduction:0,    otherDeductions:0,   totalDeductions:550,  netPay:11550, bankAccount:"AE070331234567890123459", bankName:"FAB",                      status:"approved" },
  { id:"pe5", runId:"pr2", empId:"e5", empName:"Priya Sharma",    empNo:"EMP-005", department:"Operations",  basicSalary:7500,  housing:2000, transport:500,  otherAllowances:0,    overtime:0,    grossPay:10000, absentDeduction:0,    loanDeduction:500,  otherDeductions:0,   totalDeductions:500,  netPay:9500,  bankAccount:"AE070331234567890123460", bankName:"Mashreq",                  status:"approved" },
  { id:"pe6", runId:"pr2", empId:"e6", empName:"Khalid Al-Rashidi",empNo:"EMP-006",department:"Ticketing",   basicSalary:8000,  housing:2000, transport:500,  otherAllowances:0,    overtime:800,  grossPay:11300, absentDeduction:0,    loanDeduction:0,    otherDeductions:0,   totalDeductions:0,    netPay:11300, bankAccount:"AE070331234567890123461", bankName:"Emirates NBD",             status:"approved" },
  { id:"pe7", runId:"pr2", empId:"e7", empName:"Sarah Mitchell",  empNo:"EMP-007", department:"Marketing",   basicSalary:9500,  housing:2500, transport:600,  otherAllowances:0,    overtime:0,    grossPay:12600, absentDeduction:0,    loanDeduction:0,    otherDeductions:4800,totalDeductions:4800, netPay:7800,  bankAccount:"AE070331234567890123462", bankName:"RAKBANK",                  status:"approved" },
  { id:"pe8", runId:"pr2", empId:"e8", empName:"Rashid Al-Mansouri",empNo:"EMP-008",department:"Technology", basicSalary:11000, housing:2750, transport:750,  otherAllowances:0,    overtime:0,    grossPay:14500, absentDeduction:0,    loanDeduction:0,    otherDeductions:0,   totalDeductions:0,    netPay:14500, bankAccount:"AE070331234567890123463", bankName:"ADIB",                     status:"approved" },
];

// ── Loans & Advances ──────────────────────────────────────────────────────────
export const LOANS: LoanAdvance[] = [
  { id:"ln1", empId:"e2", empName:"James Whitfield",  department:"Sales",      type:"loan",    purpose:"Home appliances purchase",      amount:12000, approvedAmount:12000, installmentAED:1000, installmentsTotal:12, installmentsPaid:3,  outstandingBalance:9000,  requestedAt:"01 Oct 2024", approvedAt:"03 Oct 2024", approvedBy:"Director",    status:"active"   },
  { id:"ln2", empId:"e5", empName:"Priya Sharma",     department:"Operations", type:"advance", purpose:"Salary advance — Eid expenses",  amount:3000,  approvedAmount:3000,  installmentAED:500,  installmentsTotal:6,  installmentsPaid:1,  outstandingBalance:2500,  requestedAt:"25 Dec 2024", approvedAt:"27 Dec 2024", approvedBy:"Ayesha Rahman",status:"active"   },
  { id:"ln3", empId:"e8", empName:"Rashid Al-Mansouri",department:"Technology",type:"loan",    purpose:"Medical expenses — family",      amount:8000,  approvedAmount:8000,  installmentAED:800,  installmentsTotal:10, installmentsPaid:10, outstandingBalance:0,      requestedAt:"01 Mar 2024", approvedAt:"04 Mar 2024", approvedBy:"Director",    status:"closed"   },
  { id:"ln4", empId:"e4", empName:"Omar Hassan",      department:"Visa",       type:"advance", purpose:"Emergency travel — Egypt",       amount:2500,  installmentAED:0,     installmentsTotal:0,  installmentsPaid:0,  outstandingBalance:2500,  requestedAt:"12 Jan 2025",                                                    status:"pending"  },
];

// ── Performance Reviews ───────────────────────────────────────────────────────
export const PERFORMANCE_REVIEWS: PerformanceReview[] = [
  {
    id:"rv1", empId:"e1", empName:"Ayesha Rahman",   designation:"Operations Manager",   department:"Operations", reviewPeriod:"H2 2024", reviewedBy:"Director",
    ratings:[
      { category:"Leadership",         score:5, comment:"Exceptional team management" },
      { category:"Quality of Work",    score:5, comment:"Consistently high standards"  },
      { category:"Communication",      score:4, comment:"Clear and effective"          },
      { category:"Punctuality",        score:5, comment:"Always on time"               },
      { category:"Initiative",         score:5, comment:"Proactively identifies issues"},
    ],
    overallScore:4.8, overallRating:"exceptional",
    strengths:["Strategic thinking","Team leadership","Process improvement"],
    improvements:["Delegation to junior staff"],
    nextReviewDate:"01 Jul 2025", status:"acknowledged",
  },
  {
    id:"rv2", empId:"e2", empName:"James Whitfield",  designation:"Senior Sales Executive",department:"Sales",      reviewPeriod:"H2 2024", reviewedBy:"Ayesha Rahman",
    ratings:[
      { category:"Sales Performance",  score:4, comment:"Exceeded Q4 target by 12%"   },
      { category:"Quality of Work",    score:4, comment:"Good attention to detail"     },
      { category:"Communication",      score:5, comment:"Excellent client relationships"},
      { category:"Punctuality",        score:3, comment:"Occasional late arrivals"     },
      { category:"Teamwork",           score:4, comment:"Strong collaborative attitude"},
    ],
    overallScore:4.0, overallRating:"exceeds",
    strengths:["Client relationship management","Sales closing","Product knowledge"],
    improvements:["Time management","Report submission timeliness"],
    nextReviewDate:"01 Jul 2025", status:"acknowledged",
  },
  {
    id:"rv3", empId:"e4", empName:"Omar Hassan",      designation:"Visa Consultant",      department:"Visa",       reviewPeriod:"H2 2024", reviewedBy:"Ayesha Rahman",
    ratings:[
      { category:"Technical Skills",   score:3, comment:"Needs improvement on complex cases" },
      { category:"Quality of Work",    score:3, comment:"Errors in documentation"       },
      { category:"Communication",      score:4, comment:"Good with customers"            },
      { category:"Punctuality",        score:2, comment:"Frequent late arrivals"         },
      { category:"Initiative",         score:3, comment:"Waits to be asked"              },
    ],
    overallScore:3.0, overallRating:"meets",
    strengths:["Customer communication","Visa knowledge — GCC"],
    improvements:["Punctuality","Document accuracy","Proactivity"],
    nextReviewDate:"01 Apr 2025", status:"submitted",
  },
  {
    id:"rv4", empId:"e6", empName:"Khalid Al-Rashidi",designation:"Ticketing Agent",      department:"Ticketing",  reviewPeriod:"H2 2024", reviewedBy:"James Whitfield",
    ratings:[
      { category:"Technical Skills",   score:4, comment:"Strong GDS proficiency"        },
      { category:"Quality of Work",    score:4, comment:"Low error rate"                },
      { category:"Communication",      score:4, comment:"Professional with clients"     },
      { category:"Punctuality",        score:5, comment:"Always early"                  },
      { category:"Teamwork",           score:4, comment:"Helpful colleague"             },
    ],
    overallScore:4.2, overallRating:"exceeds",
    strengths:["GDS skills","Accuracy","Reliability"],
    improvements:["English language writing","Upselling techniques"],
    nextReviewDate:"01 Jul 2025", status:"acknowledged",
  },
];

// ── Job Postings / Recruitment ────────────────────────────────────────────────
export const JOB_POSTINGS: JobPosting[] = [
  { id:"jp1", title:"Corporate Sales Executive",  department:"Sales",       location:"Dubai",     type:"full_time", salaryFrom:12000, salaryTo:16000, postedAt:"02 Jan 2025", stage:"interview_1",  applicantName:"Fatima Al-Mazrouei", email:"fatima@gmail.com",  experience:"5 years", nationality:"Emirati",   notes:"Strong corporate background, 2nd interview scheduled" },
  { id:"jp2", title:"Visa Processing Officer",    department:"Visa",        location:"Dubai",     type:"full_time", salaryFrom:7000,  salaryTo:9000,  postedAt:"05 Jan 2025", stage:"screening",    applicantName:"Raj Kumar",          email:"raj@gmail.com",     experience:"3 years", nationality:"Indian",    notes:"Reviewed CV — shortlisted" },
  { id:"jp3", title:"Hotel Reservations Agent",   department:"Hotels",      location:"Dubai",     type:"full_time", salaryFrom:6000,  salaryTo:8000,  postedAt:"06 Jan 2025", stage:"applied",      applicantName:"Maria Santos",       email:"maria@gmail.com",   experience:"2 years", nationality:"Filipino",  },
  { id:"jp4", title:"Marketing Manager",          department:"Marketing",   location:"Dubai",     type:"full_time", salaryFrom:14000, salaryTo:18000, postedAt:"08 Jan 2025", stage:"interview_2",  applicantName:"Ahmed Al-Zaabi",     email:"ahmed@gmail.com",   experience:"8 years", nationality:"Emirati",   notes:"Final round — Director to interview" },
  { id:"jp5", title:"IT Support Specialist",      department:"Technology",  location:"Abu Dhabi", type:"full_time", salaryFrom:8000,  salaryTo:11000, postedAt:"03 Jan 2025", stage:"offer",        applicantName:"John Okafor",        email:"john@gmail.com",    experience:"4 years", nationality:"Nigerian",  notes:"Offer letter sent — awaiting acceptance" },
  { id:"jp6", title:"Accounts Assistant",         department:"Finance",     location:"Dubai",     type:"full_time", salaryFrom:6000,  salaryTo:8000,  postedAt:"10 Jan 2025", stage:"hired",        applicantName:"Amina Hassan",       email:"amina@gmail.com",   experience:"2 years", nationality:"Somali",    notes:"Start date 01 Feb 2025" },
];

// ── Training ──────────────────────────────────────────────────────────────────
export const TRAINING_RECORDS: TrainingRecord[] = [
  { id:"tr1", empId:"e1", empName:"Ayesha Rahman",    department:"Operations", courseName:"Leadership & People Management",     provider:"Dale Carnegie UAE",        category:"Leadership",     startDate:"15 Jan 2025", endDate:"17 Jan 2025", hours:24, cost:3500, completionStatus:"scheduled", certificate:false             },
  { id:"tr2", empId:"e6", empName:"Khalid Al-Rashidi",department:"Ticketing",  courseName:"Amadeus GDS Advanced Certification", provider:"Amadeus Training Centre",  category:"Technical",      startDate:"08 Jan 2025", endDate:"10 Jan 2025", hours:18, cost:1200, completionStatus:"completed",  certificate:true,  score:88 },
  { id:"tr3", empId:"e2", empName:"James Whitfield",  department:"Sales",       courseName:"Corporate Sales Masterclass",         provider:"IATA Training",            category:"Sales",          startDate:"20 Jan 2025", endDate:"21 Jan 2025", hours:16, cost:2800, completionStatus:"scheduled", certificate:true              },
  { id:"tr4", empId:"e3", empName:"Lina Al-Sayed",   department:"Finance",     courseName:"UAE VAT & Corporate Tax 2024",        provider:"KPMG Academy UAE",         category:"Compliance",     startDate:"06 Jan 2025", endDate:"07 Jan 2025", hours:12, cost:1800, completionStatus:"completed",  certificate:true,  score:92 },
  { id:"tr5", empId:"e4", empName:"Omar Hassan",     department:"Visa",        courseName:"Schengen Visa Processing — Advanced", provider:"Internal",                 category:"Technical",      startDate:"22 Jan 2025", endDate:"22 Jan 2025", hours:8,  cost:0,    completionStatus:"scheduled", certificate:false             },
  { id:"tr6", empId:"e8", empName:"Rashid Al-Mansouri",department:"Technology",courseName:"Microsoft 365 Administration",        provider:"Microsoft Learning",       category:"Technical",      startDate:"02 Dec 2024", endDate:"06 Dec 2024", hours:40, cost:2200, completionStatus:"completed",  certificate:true,  score:85 },
];

export const fmtAED = (n: number) => "AED " + n.toLocaleString("en-US");
