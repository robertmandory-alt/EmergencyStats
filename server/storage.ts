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
  type InsertPerformanceEntry
} from "@shared/schema";
import { randomUUID } from "crypto";

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
  
  // Performance Entries
  getPerformanceEntry(id: string): Promise<PerformanceEntry | undefined>;
  getPerformanceEntriesByUser(userId: string, year?: number, month?: number): Promise<PerformanceEntry[]>;
  getPerformanceEntriesByUserAndDate(userId: string, date: string): Promise<PerformanceEntry[]>;
  createPerformanceEntry(entry: InsertPerformanceEntry): Promise<PerformanceEntry>;
  updatePerformanceEntry(id: string, updates: Partial<InsertPerformanceEntry>): Promise<PerformanceEntry | undefined>;
  deletePerformanceEntry(id: string): Promise<boolean>;
  finalizePerformanceEntries(userId: string, year: number, month: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private personnel: Map<string, Personnel>;
  private workShifts: Map<string, WorkShift>;
  private bases: Map<string, Base>;
  private performanceAssignments: Map<string, PerformanceAssignment>;
  private baseProfiles: Map<string, BaseProfile>;
  private performanceEntries: Map<string, PerformanceEntry>;

  constructor() {
    this.users = new Map();
    this.personnel = new Map();
    this.workShifts = new Map();
    this.bases = new Map();
    this.performanceAssignments = new Map();
    this.baseProfiles = new Map();
    this.performanceEntries = new Map();
    
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
    const assignment: PerformanceAssignment = { ...insertAssignment, id };
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
    const entry: PerformanceEntry = { 
      ...insertEntry, 
      id,
      missions: insertEntry.missions ?? 0,
      meals: insertEntry.meals ?? 0,
      isFinalized: insertEntry.isFinalized ?? false,
      finalizedAt: null
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

  async finalizePerformanceEntries(userId: string, year: number, month: number): Promise<boolean> {
    const entries = await this.getPerformanceEntriesByUser(userId, year, month);
    const now = new Date().toISOString();
    
    // Idempotently finalize entries (skip already finalized ones)
    entries.forEach(entry => {
      if (!entry.isFinalized) {
        const updatedEntry = { 
          ...entry, 
          isFinalized: true, 
          finalizedAt: now 
        };
        this.performanceEntries.set(entry.id, updatedEntry);
      }
    });
    
    return entries.length > 0;
  }
}

export const storage = new MemStorage();
