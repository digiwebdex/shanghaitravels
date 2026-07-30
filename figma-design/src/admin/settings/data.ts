export type UserRole = "super_admin" | "admin" | "manager" | "visa_officer" | "sales" | "finance" | "staff" | "read_only";
export type UserStatus = "active" | "inactive" | "suspended";
export type CurrencyStatus = "active" | "inactive";
export type BackupStatus = "completed" | "failed" | "running" | "scheduled";

export interface Branch {
  id: string; code: string; name: string; country: string; city: string;
  address: string; phone: string; email: string; manager: string;
  staffCount: number; active: boolean; openedAt: string;
}

export interface SystemUser {
  id: string; name: string; email: string; role: UserRole;
  department: string; branch: string; lastLogin?: string;
  status: UserStatus; createdAt: string; mfaEnabled: boolean;
}

// Permission categories + permissions
export interface PermissionGroup {
  group: string;
  permissions: { key: string; label: string }[];
}

export interface RolePermissions {
  role: UserRole; label: string;
  permissions: Record<string, boolean>;
}

export interface CurrencyConfig {
  id: string; code: string; name: string; symbol: string;
  exchangeRateToAED: number; updatedAt: string; status: CurrencyStatus;
  isBase: boolean;
}

export interface TaxConfig {
  id: string; name: string; type: "vat" | "corporate_tax" | "withholding";
  rate: number; registrationNo?: string; effectiveFrom: string; active: boolean;
  filingFrequency: "monthly" | "quarterly" | "annually";
}

export interface SmtpConfig {
  host: string; port: number; encryption: "TLS" | "SSL" | "none";
  username: string; password: string; fromName: string; fromEmail: string;
  replyToEmail: string; testMode: boolean;
}

export interface BackupRecord {
  id: string; type: "full" | "incremental" | "database";
  size: string; scheduledAt: string; completedAt?: string;
  status: BackupStatus; location: string; retentionDays: number;
}

// ── Branches ──────────────────────────────────────────────────────────────────
export const BRANCHES: Branch[] = [
  { id:"br1", code:"DXB-HQ", name:"Dubai HQ",           country:"UAE",   city:"Dubai",       address:"Office 1204, Al Moosa Tower 2, Sheikh Zayed Road, Dubai",   phone:"+971 4 123 4567", email:"dubai@travelpro.ae",   manager:"Ayesha Rahman",   staffCount:18, active:true, openedAt:"2005" },
  { id:"br2", code:"AUH-01", name:"Abu Dhabi Branch",   country:"UAE",   city:"Abu Dhabi",   address:"Hamdan Street, City Towers, Office 801, Abu Dhabi",         phone:"+971 2 234 5678", email:"abudhabi@travelpro.ae",manager:"Khalid Al-Rashidi",staffCount:6,  active:true, openedAt:"2011" },
  { id:"br3", code:"SHJ-01", name:"Sharjah Branch",     country:"UAE",   city:"Sharjah",     address:"Al Wahda Street, Rolla Square, Office 301, Sharjah",        phone:"+971 6 345 6789", email:"sharjah@travelpro.ae", manager:"Priya Sharma",    staffCount:4,  active:true, openedAt:"2015" },
  { id:"br4", code:"LHR-01", name:"London Office",      country:"UK",    city:"London",      address:"48 Whitfield Street, London W1T 2RB, UK",                   phone:"+44 20 1234 5678",email:"london@travelpro.ae",  manager:"James Whitfield", staffCount:3,  active:true, openedAt:"2019" },
  { id:"br5", code:"BOM-01", name:"Mumbai Liaison",     country:"India", city:"Mumbai",      address:"Unit 12, Nariman Point, Mumbai 400021",                     phone:"+91 22 1234 5678",email:"mumbai@travelpro.ae",  manager:"Raj Sharma",      staffCount:2,  active:false,openedAt:"2022" },
];

// ── System Users ──────────────────────────────────────────────────────────────
export const SYSTEM_USERS: SystemUser[] = [
  { id:"u1", name:"Ayesha Rahman",     email:"ayesha@travelpro.ae",   role:"admin",        department:"Operations", branch:"Dubai HQ",     lastLogin:"13 Jan 2025 09:02", status:"active",   createdAt:"01 Jan 2018", mfaEnabled:true  },
  { id:"u2", name:"James Whitfield",   email:"james@travelpro.ae",    role:"manager",      department:"Sales",      branch:"Dubai HQ",     lastLogin:"13 Jan 2025 08:55", status:"active",   createdAt:"15 Mar 2019", mfaEnabled:true  },
  { id:"u3", name:"Lina Al-Sayed",    email:"lina@travelpro.ae",     role:"finance",      department:"Finance",    branch:"Dubai HQ",     lastLogin:"13 Jan 2025 09:10", status:"active",   createdAt:"01 Jun 2020", mfaEnabled:true  },
  { id:"u4", name:"Omar Hassan",      email:"omar@travelpro.ae",     role:"visa_officer", department:"Visa",       branch:"Dubai HQ",     lastLogin:"12 Jan 2025 17:30", status:"active",   createdAt:"01 Mar 2021", mfaEnabled:false },
  { id:"u5", name:"Priya Sharma",     email:"priya@travelpro.ae",    role:"staff",        department:"Operations", branch:"Sharjah",      lastLogin:"10 Jan 2025 12:00", status:"active",   createdAt:"15 Sep 2021", mfaEnabled:false },
  { id:"u6", name:"Khalid Al-Rashidi",email:"khalid@travelpro.ae",   role:"staff",        department:"Ticketing",  branch:"Abu Dhabi",    lastLogin:"13 Jan 2025 08:44", status:"active",   createdAt:"01 Jan 2022", mfaEnabled:false },
  { id:"u7", name:"Sarah Mitchell",   email:"sarah@travelpro.ae",    role:"read_only",    department:"Marketing",  branch:"Dubai HQ",     lastLogin:"08 Jan 2025 14:20", status:"suspended",createdAt:"01 Apr 2022", mfaEnabled:false },
  { id:"u8", name:"System Admin",     email:"sysadmin@travelpro.ae", role:"super_admin",  department:"Technology", branch:"Dubai HQ",     lastLogin:"13 Jan 2025 07:00", status:"active",   createdAt:"01 Jan 2018", mfaEnabled:true  },
];

// ── Permissions ───────────────────────────────────────────────────────────────
export const PERMISSION_GROUPS: PermissionGroup[] = [
  { group:"CRM & Customers",   permissions:[{key:"crm_view",label:"View CRM"},{key:"crm_edit",label:"Edit CRM"},{key:"customers_view",label:"View Customers"},{key:"customers_edit",label:"Edit Customers"}] },
  { group:"Visa & Passports",  permissions:[{key:"visa_view",label:"View Visa"},{key:"visa_create",label:"Create Visa App"},{key:"visa_approve",label:"Approve/Reject"},{key:"passport_view",label:"View Passports"},{key:"passport_edit",label:"Edit Passports"}] },
  { group:"Finance",           permissions:[{key:"finance_view",label:"View Finance"},{key:"finance_edit",label:"Edit Journals"},{key:"invoices_view",label:"View Invoices"},{key:"invoices_edit",label:"Manage Invoices"},{key:"payroll_view",label:"View Payroll"},{key:"payroll_run",label:"Run Payroll"}] },
  { group:"HR",                permissions:[{key:"hr_view",label:"View HR"},{key:"hr_edit",label:"Edit Employees"},{key:"hr_approve",label:"Approve Leave/Loans"}] },
  { group:"Reports",           permissions:[{key:"reports_view",label:"View Reports"},{key:"reports_export",label:"Export Reports"}] },
  { group:"Settings",          permissions:[{key:"settings_view",label:"View Settings"},{key:"settings_edit",label:"Edit Settings"},{key:"users_manage",label:"Manage Users"},{key:"roles_manage",label:"Manage Roles"}] },
  { group:"CMS",               permissions:[{key:"cms_view",label:"View CMS"},{key:"cms_edit",label:"Edit Content"},{key:"cms_publish",label:"Publish Content"}] },
];

export const ROLES: { role: UserRole; label: string }[] = [
  { role:"super_admin",  label:"Super Admin" },
  { role:"admin",        label:"Admin"       },
  { role:"manager",      label:"Manager"     },
  { role:"visa_officer", label:"Visa Officer"},
  { role:"sales",        label:"Sales"       },
  { role:"finance",      label:"Finance"     },
  { role:"staff",        label:"Staff"       },
  { role:"read_only",    label:"Read Only"   },
];

// Role → permissions matrix
export const ROLE_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  super_admin:  { crm_view:true,  crm_edit:true,  customers_view:true,  customers_edit:true,  visa_view:true,  visa_create:true,  visa_approve:true,  passport_view:true,  passport_edit:true,  finance_view:true,  finance_edit:true,  invoices_view:true,  invoices_edit:true,  payroll_view:true,  payroll_run:true,  hr_view:true,  hr_edit:true,  hr_approve:true,  reports_view:true,  reports_export:true,  settings_view:true,  settings_edit:true,  users_manage:true,  roles_manage:true,  cms_view:true,  cms_edit:true,  cms_publish:true  },
  admin:        { crm_view:true,  crm_edit:true,  customers_view:true,  customers_edit:true,  visa_view:true,  visa_create:true,  visa_approve:true,  passport_view:true,  passport_edit:true,  finance_view:true,  finance_edit:true,  invoices_view:true,  invoices_edit:true,  payroll_view:true,  payroll_run:true,  hr_view:true,  hr_edit:true,  hr_approve:true,  reports_view:true,  reports_export:true,  settings_view:true,  settings_edit:true,  users_manage:true,  roles_manage:false, cms_view:true,  cms_edit:true,  cms_publish:true  },
  manager:      { crm_view:true,  crm_edit:true,  customers_view:true,  customers_edit:true,  visa_view:true,  visa_create:true,  visa_approve:false, passport_view:true,  passport_edit:false, finance_view:true,  finance_edit:false, invoices_view:true,  invoices_edit:false, payroll_view:true,  payroll_run:false, hr_view:true,  hr_edit:false, hr_approve:true,  reports_view:true,  reports_export:true,  settings_view:true,  settings_edit:false, users_manage:false, roles_manage:false, cms_view:true,  cms_edit:true,  cms_publish:false },
  visa_officer: { crm_view:true,  crm_edit:false, customers_view:true,  customers_edit:false, visa_view:true,  visa_create:true,  visa_approve:true,  passport_view:true,  passport_edit:true,  finance_view:false, finance_edit:false, invoices_view:false, invoices_edit:false, payroll_view:false, payroll_run:false, hr_view:false, hr_edit:false, hr_approve:false, reports_view:true,  reports_export:false, settings_view:false, settings_edit:false, users_manage:false, roles_manage:false, cms_view:false, cms_edit:false, cms_publish:false },
  sales:        { crm_view:true,  crm_edit:true,  customers_view:true,  customers_edit:true,  visa_view:true,  visa_create:true,  visa_approve:false, passport_view:true,  passport_edit:false, finance_view:false, finance_edit:false, invoices_view:true,  invoices_edit:false, payroll_view:false, payroll_run:false, hr_view:false, hr_edit:false, hr_approve:false, reports_view:true,  reports_export:false, settings_view:false, settings_edit:false, users_manage:false, roles_manage:false, cms_view:false, cms_edit:false, cms_publish:false },
  finance:      { crm_view:false, crm_edit:false, customers_view:true,  customers_edit:false, visa_view:false, visa_create:false, visa_approve:false, passport_view:false, passport_edit:false, finance_view:true,  finance_edit:true,  invoices_view:true,  invoices_edit:true,  payroll_view:true,  payroll_run:true,  hr_view:true,  hr_edit:false, hr_approve:false, reports_view:true,  reports_export:true,  settings_view:false, settings_edit:false, users_manage:false, roles_manage:false, cms_view:false, cms_edit:false, cms_publish:false },
  staff:        { crm_view:true,  crm_edit:false, customers_view:true,  customers_edit:false, visa_view:true,  visa_create:false, visa_approve:false, passport_view:true,  passport_edit:false, finance_view:false, finance_edit:false, invoices_view:false, invoices_edit:false, payroll_view:false, payroll_run:false, hr_view:false, hr_edit:false, hr_approve:false, reports_view:false, reports_export:false, settings_view:false, settings_edit:false, users_manage:false, roles_manage:false, cms_view:false, cms_edit:false, cms_publish:false },
  read_only:    { crm_view:true,  crm_edit:false, customers_view:true,  customers_edit:false, visa_view:true,  visa_create:false, visa_approve:false, passport_view:true,  passport_edit:false, finance_view:false, finance_edit:false, invoices_view:false, invoices_edit:false, payroll_view:false, payroll_run:false, hr_view:false, hr_edit:false, hr_approve:false, reports_view:true,  reports_export:false, settings_view:false, settings_edit:false, users_manage:false, roles_manage:false, cms_view:false, cms_edit:false, cms_publish:false },
};

// ── Currencies ────────────────────────────────────────────────────────────────
export const CURRENCIES: CurrencyConfig[] = [
  { id:"c1",  code:"AED", name:"UAE Dirham",        symbol:"AED", exchangeRateToAED:1.000,  updatedAt:"13 Jan 2025 09:00", status:"active", isBase:true  },
  { id:"c2",  code:"USD", name:"US Dollar",         symbol:"$",   exchangeRateToAED:3.6725, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c3",  code:"EUR", name:"Euro",              symbol:"€",   exchangeRateToAED:3.9841, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c4",  code:"GBP", name:"British Pound",     symbol:"£",   exchangeRateToAED:4.6120, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c5",  code:"SAR", name:"Saudi Riyal",       symbol:"SAR", exchangeRateToAED:0.9793, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c6",  code:"INR", name:"Indian Rupee",      symbol:"₹",   exchangeRateToAED:0.0440, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c7",  code:"PKR", name:"Pakistani Rupee",   symbol:"Rs",  exchangeRateToAED:0.0132, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c8",  code:"CAD", name:"Canadian Dollar",   symbol:"CA$", exchangeRateToAED:2.5580, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c9",  code:"AUD", name:"Australian Dollar", symbol:"A$",  exchangeRateToAED:2.2910, updatedAt:"13 Jan 2025 09:00", status:"active", isBase:false },
  { id:"c10", code:"QAR", name:"Qatari Riyal",      symbol:"QAR", exchangeRateToAED:1.0082, updatedAt:"13 Jan 2025 09:00", status:"inactive",isBase:false },
];

// ── Tax Config ────────────────────────────────────────────────────────────────
export const TAX_CONFIGS: TaxConfig[] = [
  { id:"t1", name:"UAE VAT",            type:"vat",            rate:5,  registrationNo:"100123456700003", effectiveFrom:"01 Jan 2018", active:true,  filingFrequency:"quarterly" },
  { id:"t2", name:"UAE Corporate Tax",  type:"corporate_tax",  rate:9,  registrationNo:"CT-2023-00123",   effectiveFrom:"01 Jun 2023", active:true,  filingFrequency:"annually"  },
];

// ── SMTP Config ───────────────────────────────────────────────────────────────
export const SMTP_CONFIG: SmtpConfig = {
  host:"smtp.office365.com", port:587, encryption:"TLS",
  username:"notifications@travelpro.ae", password:"••••••••••",
  fromName:"TravelPro Notifications", fromEmail:"notifications@travelpro.ae",
  replyToEmail:"support@travelpro.ae", testMode:false,
};

// ── Backup Records ────────────────────────────────────────────────────────────
export const BACKUP_RECORDS: BackupRecord[] = [
  { id:"bk1", type:"full",        size:"4.2 GB", scheduledAt:"13 Jan 2025 02:00", completedAt:"13 Jan 2025 02:47", status:"completed", location:"AWS S3 — eu-west-1",   retentionDays:30 },
  { id:"bk2", type:"incremental", size:"312 MB", scheduledAt:"12 Jan 2025 22:00", completedAt:"12 Jan 2025 22:08", status:"completed", location:"AWS S3 — eu-west-1",   retentionDays:7  },
  { id:"bk3", type:"incremental", size:"288 MB", scheduledAt:"12 Jan 2025 14:00", completedAt:"12 Jan 2025 14:07", status:"completed", location:"AWS S3 — eu-west-1",   retentionDays:7  },
  { id:"bk4", type:"database",    size:"1.8 GB", scheduledAt:"12 Jan 2025 02:00", completedAt:"12 Jan 2025 02:22", status:"completed", location:"AWS S3 — eu-west-1",   retentionDays:30 },
  { id:"bk5", type:"full",        size:"—",      scheduledAt:"12 Jan 2025 02:00", completedAt:"12 Jan 2025 02:15", status:"failed",    location:"Local NAS",            retentionDays:7  },
  { id:"bk6", type:"full",        size:"—",      scheduledAt:"14 Jan 2025 02:00",                                  status:"scheduled", location:"AWS S3 — eu-west-1",   retentionDays:30 },
];
