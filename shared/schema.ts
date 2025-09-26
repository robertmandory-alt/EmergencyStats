import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "admin" or "user"
  isActive: boolean("is_active").notNull().default(true),
  fullName: text("full_name"), // For pre-filling supervisor name
});

// Personnel table
export const personnel = pgTable("personnel", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nationalId: text("national_id").notNull().unique(),
  employmentStatus: text("employment_status").notNull(), // "official" or "contractual"
  productivityStatus: text("productivity_status").notNull(), // "productive" or "non_productive"
  driverStatus: text("driver_status").notNull(), // "driver" or "non_driver"
});

// Work shifts table
export const workShifts = pgTable("work_shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  equivalentHours: integer("equivalent_hours").notNull(),
  shiftCode: text("shift_code").notNull().unique(),
});

// Bases table
export const bases = pgTable("bases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  number: text("number").notNull(),
  type: text("type").notNull(), // "urban" or "road"
});

// Base profiles table (one-time setup for regular users)
export const baseProfiles = pgTable("base_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  supervisorName: text("supervisor_name").notNull(),
  supervisorNationalId: text("supervisor_national_id").notNull(),
  baseName: text("base_name").notNull(),
  baseNumber: text("base_number").notNull(),
  baseType: text("base_type").notNull(), // "urban" or "road"
  digitalSignature: text("digital_signature"), // Base64 encoded signature image
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Performance logs table (monthly log sessions)
export const performanceLogs = pgTable("performance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  baseId: varchar("base_id").notNull().references(() => bases.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  status: text("status").notNull().default("draft"), // "draft" or "finalized"
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userMonthUnique: unique().on(table.userId, table.year, table.month),
}));

// Performance assignments table
export const performanceAssignments = pgTable("performance_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logId: varchar("log_id").references(() => performanceLogs.id),
  personnelId: varchar("personnel_id").notNull().references(() => personnel.id),
  shiftId: varchar("shift_id").notNull().references(() => workShifts.id),
  baseId: varchar("base_id").notNull().references(() => bases.id),
  date: text("date").notNull(), // Jalali date as string (YYYY-MM-DD)
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
}, (table) => ({
  logPersonnelDateUnique: unique().on(table.logId, table.personnelId, table.date),
}));

// Performance entries table (for missions and meals logging)
export const performanceEntries = pgTable("performance_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logId: varchar("log_id").references(() => performanceLogs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  personnelId: varchar("personnel_id").notNull().references(() => personnel.id),
  shiftId: varchar("shift_id").references(() => workShifts.id), // Optional for summary entries
  date: text("date"), // Jalali date as string (YYYY-MM-DD) - optional for monthly summaries
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day"),
  entryType: text("entry_type").default("cell"), // "cell", "batch", or "summary"
  missions: integer("missions").notNull().default(0),
  meals: integer("meals").notNull().default(0),
  lastModifiedBy: varchar("last_modified_by").references(() => users.id),
  isFinalized: boolean("is_finalized").notNull().default(false),
  finalizedAt: text("finalized_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Iranian holidays table
export const iranHolidays = pgTable("iran_holidays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // Jalali date as string (YYYY-MM-DD)
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  title: text("title").notNull(), // Holiday name in Persian
  isOfficial: boolean("is_official").notNull().default(true),
}, (table) => ({
  dateUnique: unique().on(table.date),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertBaseProfileSchema = createInsertSchema(baseProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceLogSchema = createInsertSchema(performanceLogs).omit({
  id: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPerformanceEntrySchema = createInsertSchema(performanceEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIranHolidaySchema = createInsertSchema(iranHolidays).omit({
  id: true,
});

export const insertPersonnelSchema = createInsertSchema(personnel).omit({
  id: true,
});

export const insertWorkShiftSchema = createInsertSchema(workShifts).omit({
  id: true,
});

export const insertBaseSchema = createInsertSchema(bases).omit({
  id: true,
});

export const insertPerformanceAssignmentSchema = createInsertSchema(performanceAssignments).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BaseProfile = typeof baseProfiles.$inferSelect;
export type InsertBaseProfile = z.infer<typeof insertBaseProfileSchema>;

export type PerformanceLog = typeof performanceLogs.$inferSelect;
export type InsertPerformanceLog = z.infer<typeof insertPerformanceLogSchema>;

export type PerformanceEntry = typeof performanceEntries.$inferSelect;
export type InsertPerformanceEntry = z.infer<typeof insertPerformanceEntrySchema>;

export type IranHoliday = typeof iranHolidays.$inferSelect;
export type InsertIranHoliday = z.infer<typeof insertIranHolidaySchema>;

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;

export type WorkShift = typeof workShifts.$inferSelect;
export type InsertWorkShift = z.infer<typeof insertWorkShiftSchema>;

export type Base = typeof bases.$inferSelect;
export type InsertBase = z.infer<typeof insertBaseSchema>;

export type PerformanceAssignment = typeof performanceAssignments.$inferSelect;
export type InsertPerformanceAssignment = z.infer<typeof insertPerformanceAssignmentSchema>;
