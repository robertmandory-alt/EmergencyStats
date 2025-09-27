import { 
  type User, 
  type InsertUser,
  type Personnel,
  type InsertPersonnel,
  type WorkShift,
  type InsertWorkShift,
  type Base,
  type InsertBase,
  type PerformanceAssignment,
  type InsertPerformanceAssignment,
  type BaseProfile,
  type InsertBaseProfile,
  type PerformanceEntry,
  type InsertPerformanceEntry,
  type PerformanceLog,
  type InsertPerformanceLog,
  type IranHoliday,
  type InsertIranHoliday,
  type BaseMember,
  type InsertBaseMember
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { 
  users, 
  personnel, 
  workShifts, 
  bases, 
  performanceAssignments, 
  baseProfiles, 
  performanceEntries, 
  performanceLogs, 
  iranHolidays, 
  baseMembers 
} from "@shared/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Personnel
  getPersonnel(id: string): Promise<Personnel | undefined>;
  getAllPersonnel(): Promise<Personnel[]>;
  getPersonnelByBase(baseName: string, baseNumber: string, baseType: string): Promise<Personnel[]>;
  createPersonnel(personnel: InsertPersonnel): Promise<Personnel>;
  updatePersonnel(id: string, updates: Partial<InsertPersonnel>): Promise<Personnel | undefined>;
  deletePersonnel(id: string): Promise<boolean>;
  getPersonnelByNationalId(nationalId: string): Promise<Personnel | undefined>;
  
  // Work Shifts
  getWorkShift(id: string): Promise<WorkShift | undefined>;
  getAllWorkShifts(): Promise<WorkShift[]>;
  createWorkShift(shift: InsertWorkShift): Promise<WorkShift>;
  updateWorkShift(id: string, updates: Partial<InsertWorkShift>): Promise<WorkShift | undefined>;
  deleteWorkShift(id: string): Promise<boolean>;
  getWorkShiftByCode(code: string): Promise<WorkShift | undefined>;
  
  // Bases
  getBase(id: string): Promise<Base | undefined>;
  getAllBases(): Promise<Base[]>;
  createBase(base: InsertBase): Promise<Base>;
  updateBase(id: string, updates: Partial<InsertBase>): Promise<Base | undefined>;
  deleteBase(id: string): Promise<boolean>;
  
  // Performance Assignments
  getPerformanceAssignment(id: string): Promise<PerformanceAssignment | undefined>;
  getAllPerformanceAssignments(): Promise<PerformanceAssignment[]>;
  createPerformanceAssignment(assignment: InsertPerformanceAssignment): Promise<PerformanceAssignment>;
  updatePerformanceAssignment(id: string, updates: Partial<InsertPerformanceAssignment>): Promise<PerformanceAssignment | undefined>;
  deletePerformanceAssignment(id: string): Promise<boolean>;
  getPerformanceAssignmentsByMonth(year: number, month: number): Promise<PerformanceAssignment[]>;
  getPerformanceAssignmentsByPersonnelAndDate(personnelId: string, date: string): Promise<PerformanceAssignment | undefined>;
  deletePerformanceAssignmentsByPersonnelAndDate(personnelId: string, date: string): Promise<boolean>;
  
  // Base Profiles
  getBaseProfile(userId: string): Promise<BaseProfile | undefined>;
  createBaseProfile(profile: InsertBaseProfile): Promise<BaseProfile>;
  updateBaseProfile(userId: string, updates: Partial<InsertBaseProfile>): Promise<BaseProfile | undefined>;
  
  // Performance Logs
  getPerformanceLog(id: string): Promise<PerformanceLog | undefined>;
  getPerformanceLogByUserAndPeriod(userId: string, year: number, month: number): Promise<PerformanceLog | undefined>;
  createPerformanceLog(log: InsertPerformanceLog): Promise<PerformanceLog>;
  updatePerformanceLog(id: string, updates: Partial<InsertPerformanceLog>): Promise<PerformanceLog | undefined>;
  finalizePerformanceLog(id: string): Promise<PerformanceLog | undefined>;
  deletePerformanceLog(id: string): Promise<boolean>;
  getPerformanceLogsByUser(userId: string): Promise<PerformanceLog[]>;
  
  // Performance Entries (Updated for new schema)
  getPerformanceEntry(id: string): Promise<PerformanceEntry | undefined>;
  getPerformanceEntriesByLog(logId: string): Promise<PerformanceEntry[]>;
  getPerformanceEntriesByUser(userId: string, year?: number, month?: number): Promise<PerformanceEntry[]>;
  createPerformanceEntry(entry: InsertPerformanceEntry): Promise<PerformanceEntry>;
  updatePerformanceEntry(id: string, updates: Partial<InsertPerformanceEntry>): Promise<PerformanceEntry | undefined>;
  deletePerformanceEntry(id: string): Promise<boolean>;
  batchCreateOrUpdatePerformanceEntries(logId: string, entries: InsertPerformanceEntry[]): Promise<PerformanceEntry[]>;
  
  // Iran Holidays
  getHolidaysByMonth(year: number, month: number): Promise<IranHoliday[]>;
  createHoliday(holiday: InsertIranHoliday): Promise<IranHoliday>;
  deleteHoliday(id: string): Promise<boolean>;
  
  // Base Members
  getBaseMembersByUser(userId: string): Promise<Personnel[]>;
  addBaseMember(userId: string, personnelId: string): Promise<BaseMember>;
  removeBaseMember(userId: string, personnelId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private personnel: Map<string, Personnel>;
  private workShifts: Map<string, WorkShift>;
  private bases: Map<string, Base>;
  private performanceAssignments: Map<string, PerformanceAssignment>;
  private baseProfiles: Map<string, BaseProfile>;
  private performanceEntries: Map<string, PerformanceEntry>;
  private performanceLogs: Map<string, PerformanceLog>;
  private iranHolidays: Map<string, IranHoliday>;
  private baseMembers: Map<string, BaseMember>;

  constructor() {
    this.users = new Map();
    this.personnel = new Map();
    this.workShifts = new Map();
    this.bases = new Map();
    this.performanceAssignments = new Map();
    this.baseProfiles = new Map();
    this.performanceEntries = new Map();
    this.performanceLogs = new Map();
    this.iranHolidays = new Map();
    this.baseMembers = new Map();
    
    // Initialize default admin user
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      password: "admin1", // In production, this should be hashed
      role: "admin",
      isActive: true,
      fullName: "مدیر سیستم",
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create the required "ems" user with password "1234"
    const emsUser: User = {
      id: randomUUID(),
      username: "ems",
      password: "1234", // In production, this should be hashed
      role: "user",
      isActive: true,
      fullName: "سرپرست پایگاه اورژانس",
    };
    this.users.set(emsUser.id, emsUser);
    
    // Create a sample regular user for testing
    const regularUser: User = {
      id: randomUUID(),
      username: "supervisor1",
      password: "supervisor1", // In production, this should be hashed
      role: "user",
      isActive: true,
      fullName: "سرپرست پایگاه ۱۰۱",
    };
    this.users.set(regularUser.id, regularUser);

    // Create default work shifts
    const defaultShifts: WorkShift[] = [
      { id: randomUUID(), title: "۲۴ ساعته", equivalentHours: 24, shiftCode: "273" },
      { id: randomUUID(), title: "طولانی", equivalentHours: 12, shiftCode: "345" },
      { id: randomUUID(), title: "شب", equivalentHours: 8, shiftCode: "121" },
      { id: randomUUID(), title: "۲۴ ساعته تعطیل", equivalentHours: 24, shiftCode: "274" },
    ];
    defaultShifts.forEach(shift => this.workShifts.set(shift.id, shift));

    // Create default bases
    const defaultBases: Base[] = [
      { id: randomUUID(), name: "پایگاه ۱۰۱", number: "101", type: "urban" },
      { id: randomUUID(), name: "پایگاه ۱۰۲", number: "102", type: "road" },
      { id: randomUUID(), name: "پایگاه ۱۰۳", number: "103", type: "urban" },
    ];
    defaultBases.forEach(base => this.bases.set(base.id, base));

    // Create 4 default personnel for system testing
    const defaultPersonnel: Personnel[] = [
      {
        id: randomUUID(),
        firstName: "علی",
        lastName: "محمدی",
        nationalId: "1234567890",
        employmentStatus: "official",
        productivityStatus: "productive", 
        driverStatus: "driver"
      },
      {
        id: randomUUID(),
        firstName: "حسن",
        lastName: "احمدی", 
        nationalId: "1234567891",
        employmentStatus: "contractual",
        productivityStatus: "productive",
        driverStatus: "non_driver"
      },
      {
        id: randomUUID(),
        firstName: "محمد",
        lastName: "رضایی",
        nationalId: "1234567892", 
        employmentStatus: "official",
        productivityStatus: "productive",
        driverStatus: "driver"
      },
      {
        id: randomUUID(),
        firstName: "احمد",
        lastName: "حسینی",
        nationalId: "1234567893",
        employmentStatus: "contractual", 
        productivityStatus: "non_productive",
        driverStatus: "non_driver"
      }
    ];
    defaultPersonnel.forEach(person => this.personnel.set(person.id, person));

    // Create base profile for ems user
    const emsBaseProfile: BaseProfile = {
      id: randomUUID(),
      userId: emsUser.id,
      supervisorName: "سرپرست پایگاه اورژانس",
      supervisorNationalId: "0987654321", 
      baseName: "پایگاه ۱۰۱",
      baseNumber: "101",
      baseType: "urban",
      digitalSignature: null,
      isComplete: true,
      createdAt: new Date().toISOString()
    };
    this.baseProfiles.set(emsBaseProfile.id, emsBaseProfile);

    // Add default base members for ems user (first two personnel)
    const defaultBaseMembersForEms = [
      {
        id: randomUUID(),
        userId: emsUser.id,
        personnelId: defaultPersonnel[0].id, // علی محمدی
        addedAt: new Date()
      },
      {
        id: randomUUID(),
        userId: emsUser.id,
        personnelId: defaultPersonnel[1].id, // حسن احمدی
        addedAt: new Date()
      }
    ];
    defaultBaseMembersForEms.forEach(member => this.baseMembers.set(member.id, member));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || "user",
      isActive: insertUser.isActive ?? true,
      fullName: insertUser.fullName || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Personnel
  async getPersonnel(id: string): Promise<Personnel | undefined> {
    return this.personnel.get(id);
  }

  async getAllPersonnel(): Promise<Personnel[]> {
    return Array.from(this.personnel.values());
  }

  async createPersonnel(insertPersonnel: InsertPersonnel): Promise<Personnel> {
    const id = randomUUID();
    const person: Personnel = { ...insertPersonnel, id };
    this.personnel.set(id, person);
    return person;
  }

  async updatePersonnel(id: string, updates: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    const person = this.personnel.get(id);
    if (!person) return undefined;
    const updatedPerson = { ...person, ...updates };
    this.personnel.set(id, updatedPerson);
    return updatedPerson;
  }

  async deletePersonnel(id: string): Promise<boolean> {
    return this.personnel.delete(id);
  }

  async getPersonnelByNationalId(nationalId: string): Promise<Personnel | undefined> {
    return Array.from(this.personnel.values()).find(person => person.nationalId === nationalId);
  }

  // Work Shifts
  async getWorkShift(id: string): Promise<WorkShift | undefined> {
    return this.workShifts.get(id);
  }

  async getAllWorkShifts(): Promise<WorkShift[]> {
    return Array.from(this.workShifts.values());
  }

  async createWorkShift(insertShift: InsertWorkShift): Promise<WorkShift> {
    const id = randomUUID();
    const shift: WorkShift = { ...insertShift, id };
    this.workShifts.set(id, shift);
    return shift;
  }

  async updateWorkShift(id: string, updates: Partial<InsertWorkShift>): Promise<WorkShift | undefined> {
    const shift = this.workShifts.get(id);
    if (!shift) return undefined;
    const updatedShift = { ...shift, ...updates };
    this.workShifts.set(id, updatedShift);
    return updatedShift;
  }

  async deleteWorkShift(id: string): Promise<boolean> {
    return this.workShifts.delete(id);
  }

  async getWorkShiftByCode(code: string): Promise<WorkShift | undefined> {
    return Array.from(this.workShifts.values()).find(shift => shift.shiftCode === code);
  }

  // Bases
  async getBase(id: string): Promise<Base | undefined> {
    return this.bases.get(id);
  }

  async getAllBases(): Promise<Base[]> {
    return Array.from(this.bases.values());
  }

  async createBase(insertBase: InsertBase): Promise<Base> {
    const id = randomUUID();
    const base: Base = { ...insertBase, id };
    this.bases.set(id, base);
    return base;
  }

  async updateBase(id: string, updates: Partial<InsertBase>): Promise<Base | undefined> {
    const base = this.bases.get(id);
    if (!base) return undefined;
    const updatedBase = { ...base, ...updates };
    this.bases.set(id, updatedBase);
    return updatedBase;
  }

  async deleteBase(id: string): Promise<boolean> {
    return this.bases.delete(id);
  }

  // Performance Assignments
  async getPerformanceAssignment(id: string): Promise<PerformanceAssignment | undefined> {
    return this.performanceAssignments.get(id);
  }

  async getAllPerformanceAssignments(): Promise<PerformanceAssignment[]> {
    return Array.from(this.performanceAssignments.values());
  }

  async createPerformanceAssignment(insertAssignment: InsertPerformanceAssignment): Promise<PerformanceAssignment> {
    const id = randomUUID();
    const assignment: PerformanceAssignment = { 
      ...insertAssignment, 
      id,
      logId: insertAssignment.logId || null,
      isDeleted: insertAssignment.isDeleted ?? false
    };
    this.performanceAssignments.set(id, assignment);
    return assignment;
  }

  async updatePerformanceAssignment(id: string, updates: Partial<InsertPerformanceAssignment>): Promise<PerformanceAssignment | undefined> {
    const assignment = this.performanceAssignments.get(id);
    if (!assignment) return undefined;
    const updatedAssignment = { ...assignment, ...updates };
    this.performanceAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deletePerformanceAssignment(id: string): Promise<boolean> {
    return this.performanceAssignments.delete(id);
  }

  async getPerformanceAssignmentsByMonth(year: number, month: number): Promise<PerformanceAssignment[]> {
    return Array.from(this.performanceAssignments.values()).filter(
      assignment => assignment.year === year && assignment.month === month
    );
  }

  async getPerformanceAssignmentsByPersonnelAndDate(personnelId: string, date: string): Promise<PerformanceAssignment | undefined> {
    return Array.from(this.performanceAssignments.values()).find(
      assignment => assignment.personnelId === personnelId && assignment.date === date
    );
  }

  async deletePerformanceAssignmentsByPersonnelAndDate(personnelId: string, date: string): Promise<boolean> {
    const assignment = await this.getPerformanceAssignmentsByPersonnelAndDate(personnelId, date);
    if (assignment) {
      return this.performanceAssignments.delete(assignment.id);
    }
    return false;
  }

  // Get personnel assigned to a specific base (via performance assignments)
  async getPersonnelByBase(baseName: string, baseNumber: string, baseType: string): Promise<Personnel[]> {
    // Get all performance assignments for this base
    const baseAssignments = Array.from(this.performanceAssignments.values()).filter(assignment => {
      const base = this.bases.get(assignment.baseId);
      return base && base.name === baseName && base.number === baseNumber && base.type === baseType;
    });
    
    // Get unique personnel IDs from assignments
    const personnelIds = Array.from(new Set(baseAssignments.map(assignment => assignment.personnelId)));
    
    // Return personnel records for these IDs
    return personnelIds
      .map(id => this.personnel.get(id))
      .filter((person): person is Personnel => person !== undefined);
  }

  // Base Profiles
  async getBaseProfile(userId: string): Promise<BaseProfile | undefined> {
    return Array.from(this.baseProfiles.values()).find(profile => profile.userId === userId);
  }

  async createBaseProfile(insertProfile: InsertBaseProfile): Promise<BaseProfile> {
    // Check if profile already exists for this user
    const existingProfile = await this.getBaseProfile(insertProfile.userId);
    if (existingProfile) {
      throw new Error("Base profile already exists for this user");
    }
    
    const id = randomUUID();
    const profile: BaseProfile = { 
      ...insertProfile, 
      id,
      digitalSignature: insertProfile.digitalSignature || null,
      isComplete: insertProfile.isComplete ?? false,
      createdAt: new Date().toISOString()
    };
    this.baseProfiles.set(id, profile);
    return profile;
  }

  async updateBaseProfile(userId: string, updates: Partial<InsertBaseProfile>): Promise<BaseProfile | undefined> {
    const profile = await this.getBaseProfile(userId);
    if (!profile) return undefined;
    
    // Exclude userId from updates to prevent changing it
    const { userId: _, ...allowedUpdates } = updates;
    const updatedProfile = { ...profile, ...allowedUpdates };
    this.baseProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  // Performance Entries
  async getPerformanceEntry(id: string): Promise<PerformanceEntry | undefined> {
    return this.performanceEntries.get(id);
  }

  async getPerformanceEntriesByUser(userId: string, year?: number, month?: number): Promise<PerformanceEntry[]> {
    const entries = Array.from(this.performanceEntries.values()).filter(entry => entry.userId === userId);
    
    if (year !== undefined && month !== undefined) {
      return entries.filter(entry => entry.year === year && entry.month === month);
    }
    
    return entries;
  }

  async getPerformanceEntriesByUserAndDate(userId: string, date: string): Promise<PerformanceEntry[]> {
    return Array.from(this.performanceEntries.values()).filter(
      entry => entry.userId === userId && entry.date === date
    );
  }

  async createPerformanceEntry(insertEntry: InsertPerformanceEntry): Promise<PerformanceEntry> {
    const id = randomUUID();
    const now = new Date();
    const entry: PerformanceEntry = { 
      ...insertEntry, 
      id,
      logId: insertEntry.logId || null,
      date: insertEntry.date || null,
      day: insertEntry.day || null,
      shiftId: insertEntry.shiftId || null,
      entryType: insertEntry.entryType ?? "cell",
      missions: insertEntry.missions ?? 0,
      meals: insertEntry.meals ?? 0,
      lastModifiedBy: insertEntry.lastModifiedBy || null,
      isFinalized: insertEntry.isFinalized ?? false,
      finalizedAt: insertEntry.finalizedAt || null,
      createdAt: now,
      updatedAt: now
    };
    this.performanceEntries.set(id, entry);
    return entry;
  }

  async updatePerformanceEntry(id: string, updates: Partial<InsertPerformanceEntry>): Promise<PerformanceEntry | undefined> {
    const entry = this.performanceEntries.get(id);
    if (!entry) return undefined;
    
    // Prevent updating finalized entries
    if (entry.isFinalized) {
      throw new Error("Cannot update finalized performance entry");
    }
    
    const updatedEntry = { ...entry, ...updates };
    this.performanceEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deletePerformanceEntry(id: string): Promise<boolean> {
    const entry = this.performanceEntries.get(id);
    if (!entry) return false;
    
    // Prevent deleting finalized entries
    if (entry.isFinalized) {
      throw new Error("Cannot delete finalized performance entry");
    }
    
    return this.performanceEntries.delete(id);
  }

  // Performance Logs methods
  async getPerformanceLog(id: string): Promise<PerformanceLog | undefined> {
    return this.performanceLogs.get(id);
  }

  async getPerformanceLogByUserAndPeriod(userId: string, year: number, month: number): Promise<PerformanceLog | undefined> {
    return Array.from(this.performanceLogs.values()).find(
      log => log.userId === userId && log.year === year && log.month === month
    );
  }

  async createPerformanceLog(insertLog: InsertPerformanceLog): Promise<PerformanceLog> {
    const id = randomUUID();
    const now = new Date();
    const log: PerformanceLog = {
      ...insertLog,
      id,
      status: insertLog.status ?? "draft",
      submittedAt: null,
      createdAt: now,
      updatedAt: now
    };
    this.performanceLogs.set(id, log);
    return log;
  }

  async updatePerformanceLog(id: string, updates: Partial<InsertPerformanceLog>): Promise<PerformanceLog | undefined> {
    const log = this.performanceLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { 
      ...log, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.performanceLogs.set(id, updatedLog);
    return updatedLog;
  }

  async finalizePerformanceLog(id: string): Promise<PerformanceLog | undefined> {
    const log = this.performanceLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = {
      ...log,
      status: "finalized" as const,
      submittedAt: new Date(),
      updatedAt: new Date()
    };
    this.performanceLogs.set(id, updatedLog);
    return updatedLog;
  }

  async deletePerformanceLog(id: string): Promise<boolean> {
    return this.performanceLogs.delete(id);
  }

  async getPerformanceLogsByUser(userId: string): Promise<PerformanceLog[]> {
    return Array.from(this.performanceLogs.values()).filter(log => log.userId === userId);
  }

  // Updated Performance Entries methods
  async getPerformanceEntriesByLog(logId: string): Promise<PerformanceEntry[]> {
    return Array.from(this.performanceEntries.values()).filter(entry => entry.logId === logId);
  }

  async batchCreateOrUpdatePerformanceEntries(logId: string, entries: InsertPerformanceEntry[]): Promise<PerformanceEntry[]> {
    const results: PerformanceEntry[] = [];
    
    for (const entryData of entries) {
      // Check if entry already exists for this log, personnel, and date
      const existing = Array.from(this.performanceEntries.values()).find(
        entry => entry.logId === logId && 
                entry.personnelId === entryData.personnelId && 
                entry.date === entryData.date
      );
      
      if (existing) {
        // Update existing entry
        const updated = await this.updatePerformanceEntry(existing.id, entryData);
        if (updated) results.push(updated);
      } else {
        // Create new entry
        const created = await this.createPerformanceEntry({ ...entryData, logId });
        results.push(created);
      }
    }
    
    return results;
  }

  // Iran Holidays methods
  async getHolidaysByMonth(year: number, month: number): Promise<IranHoliday[]> {
    return Array.from(this.iranHolidays.values()).filter(
      holiday => holiday.year === year && holiday.month === month
    );
  }

  async createHoliday(insertHoliday: InsertIranHoliday): Promise<IranHoliday> {
    const id = randomUUID();
    const holiday: IranHoliday = { 
      ...insertHoliday, 
      id,
      isOfficial: insertHoliday.isOfficial ?? true
    };
    this.iranHolidays.set(id, holiday);
    return holiday;
  }

  async deleteHoliday(id: string): Promise<boolean> {
    return this.iranHolidays.delete(id);
  }

  // Base Members methods
  async getBaseMembersByUser(userId: string): Promise<Personnel[]> {
    const memberRecords = Array.from(this.baseMembers.values()).filter(
      member => member.userId === userId
    );
    const personnelIds = memberRecords.map(member => member.personnelId);
    return Array.from(this.personnel.values()).filter(
      person => personnelIds.includes(person.id)
    );
  }

  async addBaseMember(userId: string, personnelId: string): Promise<BaseMember> {
    // Check if this combination already exists
    const existing = Array.from(this.baseMembers.values()).find(
      member => member.userId === userId && member.personnelId === personnelId
    );
    if (existing) {
      throw new Error("This personnel is already a base member");
    }

    const id = randomUUID();
    const baseMember: BaseMember = {
      id,
      userId,
      personnelId,
      addedAt: new Date()
    };
    this.baseMembers.set(id, baseMember);
    return baseMember;
  }

  async removeBaseMember(userId: string, personnelId: string): Promise<boolean> {
    const existing = Array.from(this.baseMembers.values()).find(
      member => member.userId === userId && member.personnelId === personnelId
    );
    if (!existing) {
      return false;
    }
    return this.baseMembers.delete(existing.id);
  }
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Personnel
  async getPersonnel(id: string): Promise<Personnel | undefined> {
    const [person] = await db.select().from(personnel).where(eq(personnel.id, id));
    return person || undefined;
  }

  async getAllPersonnel(): Promise<Personnel[]> {
    return await db.select().from(personnel);
  }

  async createPersonnel(insertPersonnel: InsertPersonnel): Promise<Personnel> {
    const [person] = await db.insert(personnel).values(insertPersonnel).returning();
    return person;
  }

  async updatePersonnel(id: string, updates: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    const [person] = await db.update(personnel).set(updates).where(eq(personnel.id, id)).returning();
    return person || undefined;
  }

  async deletePersonnel(id: string): Promise<boolean> {
    const result = await db.delete(personnel).where(eq(personnel.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPersonnelByNationalId(nationalId: string): Promise<Personnel | undefined> {
    const [person] = await db.select().from(personnel).where(eq(personnel.nationalId, nationalId));
    return person || undefined;
  }

  async getPersonnelByBase(baseName: string, baseNumber: string, baseType: string): Promise<Personnel[]> {
    // Get base first
    const [base] = await db.select().from(bases).where(and(
      eq(bases.name, baseName),
      eq(bases.number, baseNumber),
      eq(bases.type, baseType)
    ));
    
    if (!base) return [];

    // Get personnel via performance assignments for this base
    const assignments = await db.select().from(performanceAssignments).where(eq(performanceAssignments.baseId, base.id));
    const personnelIds = Array.from(new Set(assignments.map(a => a.personnelId)));
    
    if (personnelIds.length === 0) return [];
    
    return await db.select().from(personnel).where(inArray(personnel.id, personnelIds));
  }

  // Work Shifts
  async getWorkShift(id: string): Promise<WorkShift | undefined> {
    const [shift] = await db.select().from(workShifts).where(eq(workShifts.id, id));
    return shift || undefined;
  }

  async getAllWorkShifts(): Promise<WorkShift[]> {
    return await db.select().from(workShifts);
  }

  async createWorkShift(insertShift: InsertWorkShift): Promise<WorkShift> {
    const [shift] = await db.insert(workShifts).values(insertShift).returning();
    return shift;
  }

  async updateWorkShift(id: string, updates: Partial<InsertWorkShift>): Promise<WorkShift | undefined> {
    const [shift] = await db.update(workShifts).set(updates).where(eq(workShifts.id, id)).returning();
    return shift || undefined;
  }

  async deleteWorkShift(id: string): Promise<boolean> {
    const result = await db.delete(workShifts).where(eq(workShifts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getWorkShiftByCode(code: string): Promise<WorkShift | undefined> {
    const [shift] = await db.select().from(workShifts).where(eq(workShifts.shiftCode, code));
    return shift || undefined;
  }

  // Bases
  async getBase(id: string): Promise<Base | undefined> {
    const [base] = await db.select().from(bases).where(eq(bases.id, id));
    return base || undefined;
  }

  async getAllBases(): Promise<Base[]> {
    return await db.select().from(bases);
  }

  async createBase(insertBase: InsertBase): Promise<Base> {
    const [base] = await db.insert(bases).values(insertBase).returning();
    return base;
  }

  async updateBase(id: string, updates: Partial<InsertBase>): Promise<Base | undefined> {
    const [base] = await db.update(bases).set(updates).where(eq(bases.id, id)).returning();
    return base || undefined;
  }

  async deleteBase(id: string): Promise<boolean> {
    const result = await db.delete(bases).where(eq(bases.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Performance Assignments
  async getPerformanceAssignment(id: string): Promise<PerformanceAssignment | undefined> {
    const [assignment] = await db.select().from(performanceAssignments).where(eq(performanceAssignments.id, id));
    return assignment || undefined;
  }

  async getAllPerformanceAssignments(): Promise<PerformanceAssignment[]> {
    return await db.select().from(performanceAssignments);
  }

  async createPerformanceAssignment(insertAssignment: InsertPerformanceAssignment): Promise<PerformanceAssignment> {
    const [assignment] = await db.insert(performanceAssignments).values({
      ...insertAssignment,
      isDeleted: insertAssignment.isDeleted ?? false
    }).returning();
    return assignment;
  }

  async updatePerformanceAssignment(id: string, updates: Partial<InsertPerformanceAssignment>): Promise<PerformanceAssignment | undefined> {
    const [assignment] = await db.update(performanceAssignments).set(updates).where(eq(performanceAssignments.id, id)).returning();
    return assignment || undefined;
  }

  async deletePerformanceAssignment(id: string): Promise<boolean> {
    const result = await db.delete(performanceAssignments).where(eq(performanceAssignments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPerformanceAssignmentsByMonth(year: number, month: number): Promise<PerformanceAssignment[]> {
    return await db.select().from(performanceAssignments).where(and(
      eq(performanceAssignments.year, year),
      eq(performanceAssignments.month, month)
    ));
  }

  async getPerformanceAssignmentsByPersonnelAndDate(personnelId: string, date: string): Promise<PerformanceAssignment | undefined> {
    const [assignment] = await db.select().from(performanceAssignments).where(and(
      eq(performanceAssignments.personnelId, personnelId),
      eq(performanceAssignments.date, date)
    ));
    return assignment || undefined;
  }

  async deletePerformanceAssignmentsByPersonnelAndDate(personnelId: string, date: string): Promise<boolean> {
    const result = await db.delete(performanceAssignments).where(and(
      eq(performanceAssignments.personnelId, personnelId),
      eq(performanceAssignments.date, date)
    ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Base Profiles
  async getBaseProfile(userId: string): Promise<BaseProfile | undefined> {
    const [profile] = await db.select().from(baseProfiles).where(eq(baseProfiles.userId, userId));
    return profile || undefined;
  }

  async createBaseProfile(insertProfile: InsertBaseProfile): Promise<BaseProfile> {
    const [profile] = await db.insert(baseProfiles).values({
      ...insertProfile,
      isComplete: insertProfile.isComplete ?? false
    }).returning();
    return profile;
  }

  async updateBaseProfile(userId: string, updates: Partial<InsertBaseProfile>): Promise<BaseProfile | undefined> {
    const [profile] = await db.update(baseProfiles).set(updates).where(eq(baseProfiles.userId, userId)).returning();
    return profile || undefined;
  }

  // Performance Logs
  async getPerformanceLog(id: string): Promise<PerformanceLog | undefined> {
    const [log] = await db.select().from(performanceLogs).where(eq(performanceLogs.id, id));
    return log || undefined;
  }

  async getPerformanceLogByUserAndPeriod(userId: string, year: number, month: number): Promise<PerformanceLog | undefined> {
    const [log] = await db.select().from(performanceLogs).where(and(
      eq(performanceLogs.userId, userId),
      eq(performanceLogs.year, year),
      eq(performanceLogs.month, month)
    ));
    return log || undefined;
  }

  async createPerformanceLog(insertLog: InsertPerformanceLog): Promise<PerformanceLog> {
    const [log] = await db.insert(performanceLogs).values({
      ...insertLog,
      status: insertLog.status ?? "draft"
    }).returning();
    return log;
  }

  async updatePerformanceLog(id: string, updates: Partial<InsertPerformanceLog>): Promise<PerformanceLog | undefined> {
    const [log] = await db.update(performanceLogs).set(updates).where(eq(performanceLogs.id, id)).returning();
    return log || undefined;
  }

  async finalizePerformanceLog(id: string): Promise<PerformanceLog | undefined> {
    const [log] = await db.update(performanceLogs).set({
      status: "finalized",
      submittedAt: new Date()
    }).where(eq(performanceLogs.id, id)).returning();
    return log || undefined;
  }

  async deletePerformanceLog(id: string): Promise<boolean> {
    const result = await db.delete(performanceLogs).where(eq(performanceLogs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPerformanceLogsByUser(userId: string): Promise<PerformanceLog[]> {
    return await db.select().from(performanceLogs).where(eq(performanceLogs.userId, userId)).orderBy(desc(performanceLogs.createdAt));
  }

  // Performance Entries
  async getPerformanceEntry(id: string): Promise<PerformanceEntry | undefined> {
    const [entry] = await db.select().from(performanceEntries).where(eq(performanceEntries.id, id));
    return entry || undefined;
  }

  async getPerformanceEntriesByLog(logId: string): Promise<PerformanceEntry[]> {
    return await db.select().from(performanceEntries).where(eq(performanceEntries.logId, logId));
  }

  async getPerformanceEntriesByUser(userId: string, year?: number, month?: number): Promise<PerformanceEntry[]> {
    if (year !== undefined && month !== undefined) {
      return await db.select().from(performanceEntries).where(and(
        eq(performanceEntries.userId, userId),
        eq(performanceEntries.year, year),
        eq(performanceEntries.month, month)
      ));
    }
    
    return await db.select().from(performanceEntries).where(eq(performanceEntries.userId, userId));
  }

  async createPerformanceEntry(insertEntry: InsertPerformanceEntry): Promise<PerformanceEntry> {
    const [entry] = await db.insert(performanceEntries).values({
      ...insertEntry,
      entryType: insertEntry.entryType ?? "cell",
      missions: insertEntry.missions ?? 0,
      meals: insertEntry.meals ?? 0,
      isFinalized: insertEntry.isFinalized ?? false
    }).returning();
    return entry;
  }

  async updatePerformanceEntry(id: string, updates: Partial<InsertPerformanceEntry>): Promise<PerformanceEntry | undefined> {
    const [entry] = await db.update(performanceEntries).set(updates).where(eq(performanceEntries.id, id)).returning();
    return entry || undefined;
  }

  async deletePerformanceEntry(id: string): Promise<boolean> {
    const result = await db.delete(performanceEntries).where(eq(performanceEntries.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async batchCreateOrUpdatePerformanceEntries(logId: string, entries: InsertPerformanceEntry[]): Promise<PerformanceEntry[]> {
    const results: PerformanceEntry[] = [];
    
    for (const entryData of entries) {
      // Check if entry already exists for this log, personnel, and date
      const [existing] = await db.select().from(performanceEntries).where(and(
        eq(performanceEntries.logId, logId),
        eq(performanceEntries.personnelId, entryData.personnelId),
        eq(performanceEntries.date, entryData.date || "")
      ));
      
      if (existing) {
        // Update existing entry
        const updated = await this.updatePerformanceEntry(existing.id, entryData);
        if (updated) results.push(updated);
      } else {
        // Create new entry
        const created = await this.createPerformanceEntry({ ...entryData, logId });
        results.push(created);
      }
    }
    
    return results;
  }

  // Iran Holidays
  async getHolidaysByMonth(year: number, month: number): Promise<IranHoliday[]> {
    return await db.select().from(iranHolidays).where(and(
      eq(iranHolidays.year, year),
      eq(iranHolidays.month, month)
    ));
  }

  async createHoliday(insertHoliday: InsertIranHoliday): Promise<IranHoliday> {
    const [holiday] = await db.insert(iranHolidays).values({
      ...insertHoliday,
      isOfficial: insertHoliday.isOfficial ?? true
    }).returning();
    return holiday;
  }

  async deleteHoliday(id: string): Promise<boolean> {
    const result = await db.delete(iranHolidays).where(eq(iranHolidays.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Base Members
  async getBaseMembersByUser(userId: string): Promise<Personnel[]> {
    const memberRecords = await db.select().from(baseMembers).where(eq(baseMembers.userId, userId));
    const personnelIds = memberRecords.map(member => member.personnelId);
    
    if (personnelIds.length === 0) return [];
    
    return await db.select().from(personnel).where(inArray(personnel.id, personnelIds));
  }

  async addBaseMember(userId: string, personnelId: string): Promise<BaseMember> {
    // Check if this combination already exists
    const [existing] = await db.select().from(baseMembers).where(and(
      eq(baseMembers.userId, userId),
      eq(baseMembers.personnelId, personnelId)
    ));
    
    if (existing) {
      throw new Error("This personnel is already a base member");
    }

    const [member] = await db.insert(baseMembers).values({
      userId,
      personnelId
    }).returning();
    return member;
  }

  async removeBaseMember(userId: string, personnelId: string): Promise<boolean> {
    const result = await db.delete(baseMembers).where(and(
      eq(baseMembers.userId, userId),
      eq(baseMembers.personnelId, personnelId)
    ));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
