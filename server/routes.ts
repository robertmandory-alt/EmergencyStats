import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPersonnelSchema, insertWorkShiftSchema, insertBaseSchema, insertPerformanceAssignmentSchema } from "@shared/schema";

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

      // In production, use proper session management
      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: "خطا در سرور" });
    }
  });

  // Users management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت کاربران" });
    }
  });

  app.post("/api/users", async (req, res) => {
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

  app.put("/api/users/:id", async (req, res) => {
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

  app.delete("/api/users/:id", async (req, res) => {
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
      const personnel = await storage.getAllPersonnel();
      res.json(personnel);
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت پرسنل" });
    }
  });

  app.post("/api/personnel", async (req, res) => {
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
      const updates = insertPersonnelSchema.partial().parse(req.body);
      const person = await storage.updatePersonnel(req.params.id, updates);
      
      if (!person) {
        return res.status(404).json({ error: "پرسنل یافت نشد" });
      }

      res.json(person);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.delete("/api/personnel/:id", async (req, res) => {
    try {
      const success = await storage.deletePersonnel(req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "پرسنل یافت نشد" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "خطا در حذف پرسنل" });
    }
  });

  // Work shifts routes
  app.get("/api/work-shifts", async (req, res) => {
    try {
      const shifts = await storage.getAllWorkShifts();
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت شیفت‌ها" });
    }
  });

  app.post("/api/work-shifts", async (req, res) => {
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

  app.put("/api/work-shifts/:id", async (req, res) => {
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

  app.delete("/api/work-shifts/:id", async (req, res) => {
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
  app.get("/api/bases", async (req, res) => {
    try {
      const bases = await storage.getAllBases();
      res.json(bases);
    } catch (error) {
      res.status(500).json({ error: "خطا در دریافت پایگاه‌ها" });
    }
  });

  app.post("/api/bases", async (req, res) => {
    try {
      const baseData = insertBaseSchema.parse(req.body);
      const base = await storage.createBase(baseData);
      res.json(base);
    } catch (error) {
      res.status(400).json({ error: "داده‌های وارد شده نامعتبر است" });
    }
  });

  app.put("/api/bases/:id", async (req, res) => {
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

  app.delete("/api/bases/:id", async (req, res) => {
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
  app.get("/api/performance-assignments", async (req, res) => {
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

  app.post("/api/performance-assignments", async (req, res) => {
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

  app.put("/api/performance-assignments/:id", async (req, res) => {
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

  app.delete("/api/performance-assignments/:id", async (req, res) => {
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

  app.delete("/api/performance-assignments/by-date", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
