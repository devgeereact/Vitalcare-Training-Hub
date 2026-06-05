/**
 * Shared option lists and constants used across workbook builders. Kept in one
 * place so dropdowns and summary course lists stay consistent.
 */
import { COMPANY, LEADERSHIP } from "@/lib/constants"

export const CREATOR = COMPANY.legalName

/** Trainers offered as a dropdown on the Certificate Log and elsewhere. */
export const TRAINERS = [
  LEADERSHIP.clinicalDirector.name,
  LEADERSHIP.ceo.name,
] as const

/** Core courses used to seed summary rollups, matching the sample workbooks. */
export const SUMMARY_COURSES = [
  "BLS",
  "IPC",
  "Manual Handling",
  "Safeguarding Adults",
] as const

export const PAYMENT_STATUSES = ["Paid", "Part Paid", "Pending"] as const
export const INVOICE_STATUSES = ["Paid", "Pending", "Overdue"] as const
export const CONFIRMATION = ["Yes", "No"] as const
export const CERT_STATUSES = ["Active", "Expired", "Revoked"] as const
export const ACCOUNT_STATUSES = ["Active", "Lapsed", "Prospect"] as const

export const EXPENSE_CATEGORIES = [
  "Marketing",
  "Equipment",
  "Software",
  "Office",
  "Travel",
  "Other",
] as const

export const JOB_ROLES = [
  "Registered Nurse",
  "Healthcare Assistant",
  "Senior Carer",
  "Support Worker",
  "Care Coordinator",
] as const

export const ORG_TYPES = [
  "Care Home",
  "NHS",
  "Home Care Agency",
  "Private Hospital",
  "Care Agency",
  "Community Care",
  "Supported Living",
  "Other",
] as const

/** Twelve month labels for 2026, used to seed dashboards and forecasts. */
export const MONTHS_2026 = [
  "January 2026",
  "February 2026",
  "March 2026",
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026",
  "September 2026",
  "October 2026",
  "November 2026",
  "December 2026",
] as const
