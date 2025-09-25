import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPersonnelSchema, insertWorkShiftSchema, insertBaseSchema, insertPerformanceAssignmentSchema, insertBaseProfileSchema, insertPerformanceEntrySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "نام کاربری و رمز عبور الزامی است" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password || !user.isActive) {
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }

      // Store user in session for subsequent requests
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName || undefined
      };
      
      res.json({ user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName } });
    } catch (error) {
      res.status(500).json({ error: "خطا در سرور" });
    }
  });

  // Users management routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت کاربران" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ error: "نام کاربری قبلاً استفاده شده است" });
      }

      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, updates);
      
      if (!user) {
        return res.status(404).json({ error: "کاربر یافت نشد" });
      }

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "کاربر یافت نشد" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در حذف کاربر" });
    }
  });

  // Personnel routes
  app.get("/api/personnel", async (req, res) => {
    try {
      // Require authentication for personnel access
      const { userId, userRole } = validateUserPermissions(req);
      
      if (userRole === 'admin') {
        // Admins can see all personnel
        const personnel = await storage.getAllPersonnel();
        res.json(personnel);
      } else {
        // Regular users can only see personnel from their base
        const baseProfile = await storage.getBaseProfile(userId);
        if (!baseProfile || !baseProfile.isComplete) {
          return res.status(403).json({ error: "پروفایل پایگاه تکمیل نشده است" });
        }
        
        // Get personnel assigned to this user's base
        const personnel = await storage.getPersonnelByBase(
          baseProfile.baseName,
          baseProfile.baseNumber,
          baseProfile.baseType
        );
        res.json(personnel);
      }
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(500).json({ error: "خطا در دریافت پرسنل" });
    }
  });

  app.post("/api/personnel", requireAuth, requireAdmin, async (req, res) => {
    try {
      const personnelData = insertPersonnelSchema.parse(req.body);
      const existing = await storage.getPersonnelByNationalId(personnelData.nationalId);
      
      if (existing) {
        return res.status(400).json({ error: "کد ملی قبلاً استفاده شده است" });
      }

      const person = await storage.createPersonnel(personnelData);
      res.json(person);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/personnel/:id", async (req, res) => {
    try {
      // Validate authentication and get user info
      const { userRole } = validateUserPermissions(req);
      
      // Only admins can do full updates via PUT
      if (userRole !== 'admin') {
        return res.status(403).json({ 
          error: "دسترسی غیرمجاز: فقط ادمین‌ها می‌توانند به‌روزرسانی کامل انجام دهند" 
        });
      }
      
      const updates = insertPersonnelSchema.partial().parse(req.body);
      const person = await storage.updatePersonnel(req.params.id, updates);
      
      if (!person) {
        return res.status(404).json({ error: "پرسنل یافت نشد" });
      }

      res.json(person);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  // PATCH route for partial updates - regular users can only update productivity status
  app.patch("/api/personnel/:id", async (req, res) => {
    try {
      // Validate authentication and get user info
      const { userId, userRole } = validateUserPermissions(req);
      
      const updates = insertPersonnelSchema.partial().parse(req.body);
      
      if (userRole === 'admin') {
        // Admins can update any field
        const person = await storage.updatePersonnel(req.params.id, updates);
        
        if (!person) {
          return res.status(404).json({ error: "پرسنل یافت نشد" });
        }

        res.json(person);
      } else {
        // Regular users can only update productivity status
        const allowedFields = ['productivityStatus'];
        const requestedFields = Object.keys(updates);
        const unauthorizedFields = requestedFields.filter(field => !allowedFields.includes(field));
        
        if (unauthorizedFields.length > 0) {
          return res.status(403).json({ 
            error: `دسترسی غیرمجاز: فقط فیلدهای ${allowedFields.join(', ')} قابل ویرایش است` 
          });
        }
        
        // Verify that this personnel belongs to user's base
        const baseProfile = await storage.getBaseProfile(userId);
        if (!baseProfile || !baseProfile.isComplete) {
          return res.status(403).json({ error: "پروفایل پایگاه تکمیل نشده است" });
        }
        
        // Get personnel assigned to this user's base
        const basePersonnel = await storage.getPersonnelByBase(
          baseProfile.baseName,
          baseProfile.baseNumber,
          baseProfile.baseType
        );
        
        // Check if the requested personnel ID is in the base personnel list
        const isPersonnelInBase = basePersonnel.some(p => p.id === req.params.id);
        if (!isPersonnelInBase) {
          return res.status(403).json({ 
            error: "دسترسی غیرمجاز: این پرسنل متعلق به پایگاه شما نیست" 
          });
        }
        
        const person = await storage.updatePersonnel(req.params.id, updates);
        
        if (!person) {
          return res.status(404).json({ error: "پرسنل یافت نشد" });
        }

        res.json(person);
      }
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  // Helper function to validate user authentication from session
  function validateUserPermissions(req: any) {
    // Check if user is authenticated via session
    if (!req.user || !req.session?.user) {
      throw new Error('Authentication required');
    }
    
    return {
      userId: req.user.id,
      userRole: req.user.role,
      username: req.user.username
    };
  }

  // Middleware to require authentication
  function requireAuth(req: any, res: any, next: any) {
    try {
      validateUserPermissions(req);
      next();
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      return res.status(500).json({ error: "خطا در سرور" });
    }
  }

  // Middleware to require admin role
  function requireAdmin(req: any, res: any, next: any) {
    try {
      const { userRole } = validateUserPermissions(req);
      if (userRole !== 'admin') {
        return res.status(403).json({ 
          error: "دسترسی غیرمجاز: فقط ادمین‌ها دسترسی دارند" 
        });
      }
      next();
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      return res.status(500).json({ error: "خطا در سرور" });
    }
  }


  app.delete("/api/personnel/:id", async (req, res) => {
    try {
      // Validate authentication and get user info
      const { userRole } = validateUserPermissions(req);
      
      // Only admins can delete personnel
      if (userRole !== 'admin') {
        return res.status(403).json({ 
          error: "دسترسی غیرمجاز: فقط ادمین‌ها می‌توانند پرسنل را حذف کنند" 
        });
      }
      
      const success = await storage.deletePersonnel(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "پرسنل یافت نشد" });
      }

      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(500).json({ error: "خطا در حذف پرسنل" });
    }
  });

  // Work shifts routes
  app.get("/api/work-shifts", requireAdmin, async (req, res) => {
    try {
      const shifts = await storage.getAllWorkShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت شیفت‌ها" });
    }
  });

  app.post("/api/work-shifts", requireAdmin, async (req, res) => {
    try {
      const shiftData = insertWorkShiftSchema.parse(req.body);
      const existing = await storage.getWorkShiftByCode(shiftData.shiftCode);
      
      if (existing) {
        return res.status(400).json({ error: "کد شیفت قبلاً استفاده شده است" });
      }

      const shift = await storage.createWorkShift(shiftData);
      res.json(shift);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/work-shifts/:id", requireAdmin, async (req, res) => {
    try {
      const updates = insertWorkShiftSchema.partial().parse(req.body);
      const shift = await storage.updateWorkShift(req.params.id, updates);
      
      if (!shift) {
        return res.status(404).json({ error: "شیفت یافت نشد" });
      }

      res.json(shift);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.delete("/api/work-shifts/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteWorkShift(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "شیفت یافت نشد" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در حذف شیفت" });
    }
  });

  // Bases routes
  app.get("/api/bases", requireAdmin, async (req, res) => {
    try {
      const bases = await storage.getAllBases();
      res.json(bases);
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت پایگاه‌ها" });
    }
  });

  app.post("/api/bases", requireAdmin, async (req, res) => {
    try {
      const baseData = insertBaseSchema.parse(req.body);
      const base = await storage.createBase(baseData);
      res.json(base);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/bases/:id", requireAdmin, async (req, res) => {
    try {
      const updates = insertBaseSchema.partial().parse(req.body);
      const base = await storage.updateBase(req.params.id, updates);
      
      if (!base) {
        return res.status(404).json({ error: "پایگاه یافت نشد" });
      }

      res.json(base);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.delete("/api/bases/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteBase(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "پایگاه یافت نشد" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در حذف پایگاه" });
    }
  });

  // Performance assignments routes
  app.get("/api/performance-assignments", requireAdmin, async (req, res) => {
    try {
      const { year, month } = req.query;
      
      if (year && month) {
        const assignments = await storage.getPerformanceAssignmentsByMonth(
          parseInt(year as string),
          parseInt(month as string)
        );
        res.json(assignments);
      } else {
        const assignments = await storage.getAllPerformanceAssignments();
        res.json(assignments);
      }
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت تخصیص‌ها" });
    }
  });

  app.post("/api/performance-assignments", requireAdmin, async (req, res) => {
    try {
      const assignmentData = insertPerformanceAssignmentSchema.parse(req.body);
      
      // Check if assignment already exists for this personnel and date
      const existing = await storage.getPerformanceAssignmentsByPersonnelAndDate(
        assignmentData.personnelId,
        assignmentData.date
      );
      
      if (existing) {
        return res.status(400).json({ error: "برای این پرسنل در این تاریخ قبلاً شیفت تعریف شده است" });
      }

      const assignment = await storage.createPerformanceAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/performance-assignments/:id", requireAdmin, async (req, res) => {
    try {
      const updates = insertPerformanceAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updatePerformanceAssignment(req.params.id, updates);
      
      if (!assignment) {
        return res.status(404).json({ error: "تخصیص یافت نشد" });
      }

      res.json(assignment);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.delete("/api/performance-assignments/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deletePerformanceAssignment(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "تخصیص یافت نشد" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در حذف تخصیص" });
    }
  });

  app.delete("/api/performance-assignments/by-date", requireAdmin, async (req, res) => {
    try {
      const { personnelId, date } = req.body;
      
      if (!personnelId || !date) {
        return res.status(400).json({ error: "شناسه پرسنل و تاریخ الزامی است" });
      }

      const success = await storage.deletePerformanceAssignmentsByPersonnelAndDate(personnelId, date);
      
      if (!success) {
        return res.status(404).json({ error: "تخصیص یافت نشد" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در حذف تخصیص" });
    }
  });

  // Base Profile routes
  app.get("/api/base-profile", async (req, res) => {
    try {
      // Require authentication and use session user ID
      const { userId, userRole } = validateUserPermissions(req);
      
      // Admins can access any user's profile via query param
      const targetUserId = userRole === 'admin' && req.query.userId ? req.query.userId as string : userId;
      
      const profile = await storage.getBaseProfile(targetUserId);
      
      if (!profile) {
        return res.status(404).json({ error: "پروفایل پایگاه یافت نشد" });
      }

      res.json(profile);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(500).json({ error: "خطا در دریافت پروفایل پایگاه" });
    }
  });

  app.post("/api/base-profile", async (req, res) => {
    try {
      // Require authentication and use session user ID
      const { userId, userRole } = validateUserPermissions(req);
      
      // Only regular users can create base profiles
      if (userRole !== 'user') {
        return res.status(403).json({ error: "تنها کاربران عادی می‌توانند پروفایل پایگاه ایجاد کنند" });
      }
      
      // Parse and validate the profile data
      const profileData = insertBaseProfileSchema.parse(req.body);
      // Override any client-supplied userId with session userId
      profileData.userId = userId;
      
      const profile = await storage.createBaseProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      if (error.message === "Base profile already exists for this user") {
        return res.status(400).json({ error: "پروفایل پایگاه برای این کاربر قبلاً ایجاد شده است" });
      }
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/base-profile", async (req, res) => {
    try {
      // Require authentication and use session user ID
      const { userId, userRole } = validateUserPermissions(req);
      
      const updates = insertBaseProfileSchema.partial().parse(req.body);
      // Prevent userId from being changed
      delete updates.userId;
      
      // Admins can update any user's profile via query param
      const targetUserId = userRole === 'admin' && req.query.userId ? req.query.userId as string : userId;
      
      // Verify a base profile exists for the target user
      const existingProfile = await storage.getBaseProfile(targetUserId);
      if (!existingProfile) {
        return res.status(404).json({ error: "پروفایل پایگاه یافت نشد" });
      }
      
      const profile = await storage.updateBaseProfile(targetUserId, updates);
      
      if (!profile) {
        return res.status(500).json({ error: "خطا در به‌روزرسانی پروفایل" });
      }

      res.json(profile);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  // Performance Entries routes
  app.get("/api/performance-entries", async (req, res) => {
    try {
      // Require authentication and use session user ID
      const { userId } = validateUserPermissions(req);
      const { year, month } = req.query;

      const entries = await storage.getPerformanceEntriesByUser(
        userId, // Use session user ID, not client-supplied
        year ? parseInt(year as string) : undefined,
        month ? parseInt(month as string) : undefined
      );
      
      res.json(entries);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(500).json({ error: "خطا در دریافت عملکرد" });
    }
  });

  app.post("/api/performance-entries", async (req, res) => {
    try {
      // Require authentication and use session user ID
      const { userId } = validateUserPermissions(req);
      
      const entryData = insertPerformanceEntrySchema.parse(req.body);
      // Override any client-supplied userId with session userId
      entryData.userId = userId;
      
      const entry = await storage.createPerformanceEntry(entryData);
      res.json(entry);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/performance-entries/:id", async (req, res) => {
    try {
      // Require authentication and verify ownership
      const { userId } = validateUserPermissions(req);
      
      // First check if the entry exists and belongs to this user
      const existingEntry = await storage.getPerformanceEntry(req.params.id);
      if (!existingEntry) {
        return res.status(404).json({ error: "ورودی عملکرد یافت نشد" });
      }
      
      if (existingEntry.userId !== userId) {
        return res.status(403).json({ error: "دسترسی غیرمجاز: این ورودی متعلق به شما نیست" });
      }
      
      const updates = insertPerformanceEntrySchema.partial().parse(req.body);
      // Prevent userId from being changed
      delete updates.userId;
      
      const entry = await storage.updatePerformanceEntry(req.params.id, updates);
      
      if (!entry) {
        return res.status(404).json({ error: "ورودی عملکرد یافت نشد" });
      }

      res.json(entry);
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      if (error.message === "Cannot update finalized performance entry") {
        return res.status(400).json({ error: "امکان ویرایش ورودی نهایی شده وجود ندارد" });
      }
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.delete("/api/performance-entries/:id", async (req, res) => {
    try {
      // Require authentication and verify ownership
      const { userId } = validateUserPermissions(req);
      
      // First check if the entry exists and belongs to this user
      const existingEntry = await storage.getPerformanceEntry(req.params.id);
      if (!existingEntry) {
        return res.status(404).json({ error: "ورودی عملکرد یافت نشد" });
      }
      
      if (existingEntry.userId !== userId) {
        return res.status(403).json({ error: "دسترسی غیرمجاز: این ورودی متعلق به شما نیست" });
      }
      
      const success = await storage.deletePerformanceEntry(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "ورودی عملکرد یافت نشد" });
      }

      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      if (error.message === "Cannot delete finalized performance entry") {
        return res.status(400).json({ error: "امکان حذف ورودی نهایی شده وجود ندارد" });
      }
      res.status(500).json({ error: "خطا در حذف ورودی عملکرد" });
    }
  });

  app.post("/api/performance-entries/finalize", async (req, res) => {
    try {
      // Require authentication and use session user ID
      const { userId } = validateUserPermissions(req);
      const { year, month } = req.body;
      
      if (!year || !month) {
        return res.status(400).json({ error: "سال و ماه الزامی است" });
      }

      const success = await storage.finalizePerformanceEntries(userId, year, month);
      
      if (!success) {
        return res.status(404).json({ error: "هیچ ورودی برای نهایی شدن یافت نشد" });
      }

      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'Authentication required') {
        return res.status(401).json({ error: "احراز هویت لازم است" });
      }
      res.status(500).json({ error: "خطا در نهایی کردن ورودی‌ها" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
