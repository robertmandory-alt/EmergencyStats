import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer } from "drizzle-orm/pg-core";
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

// Performance assignments table
export const performanceAssignments = pgTable("performance_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personnelId: varchar("personnel_id").notNull().references(() => personnel.id),
  shiftId: varchar("shift_id").notNull().references(() => workShifts.id),
  baseId: varchar("base_id").notNull().references(() => bases.id),
  date: text("date").notNull(), // Jalali date as string (YYYY-MM-DD)
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
});

// Performance entries table (for missions and meals logging)
export const performanceEntries = pgTable("performance_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  personnelId: varchar("personnel_id").notNull().references(() => personnel.id),
  shiftId: varchar("shift_id").notNull().references(() => workShifts.id),
  date: text("date").notNull(), // Jalali date as string (YYYY-MM-DD)
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  day: integer("day").notNull(),
  missions: integer("missions").notNull().default(0),
  meals: integer("meals").notNull().default(0),
  isFinalized: boolean("is_finalized").notNull().default(false),
  finalizedAt: text("finalized_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertBaseProfileSchema = createInsertSchema(baseProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceEntrySchema = createInsertSchema(performanceEntries).omit({
  id: true,
  finalizedAt: true,
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

export type PerformanceEntry = typeof performanceEntries.$inferSelect;
export type InsertPerformanceEntry = z.infer<typeof insertPerformanceEntrySchema>;

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;

export type WorkShift = typeof workShifts.$inferSelect;
export type InsertWorkShift = z.infer<typeof insertWorkShiftSchema>;

export type Base = typeof bases.$inferSelect;
export type InsertBase = z.infer<typeof insertBaseSchema>;

export type PerformanceAssignment = typeof performanceAssignments.$inferSelect;
export type InsertPerformanceAssignment = z.infer<typeof insertPerformanceAssignmentSchema>;
