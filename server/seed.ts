import { db } from "./db";
import { 
  users, 
  personnel, 
  workShifts, 
  bases, 
  baseProfiles,
  baseMembers 
} from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 شروع seed کردن دیتابیس...");

  try {
    // Create default admin user
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: "admin1", // In production, this should be hashed
      role: "admin",
      isActive: true,
      fullName: "مدیر سیستم"
    }).onConflictDoNothing().returning();

    console.log("✅ کاربر ادمین ایجاد شد");

    // Create the required "ems" user with password "1234"
    const [emsUser] = await db.insert(users).values({
      username: "ems",
      password: "1234", // In production, this should be hashed
      role: "user",
      isActive: true,
      fullName: "سرپرست پایگاه اورژانس"
    }).onConflictDoNothing().returning();

    console.log("✅ کاربر ems ایجاد شد");

    // Create a sample regular user for testing
    const [regularUser] = await db.insert(users).values({
      username: "supervisor1",
      password: "supervisor1", // In production, this should be hashed
      role: "user",
      isActive: true,
      fullName: "سرپرست پایگاه ۱۰۱"
    }).onConflictDoNothing().returning();

    console.log("✅ کاربر معمولی ایجاد شد");

    // Create default work shifts
    const defaultShifts = [
      { title: "۲۴ ساعته", equivalentHours: 24, shiftCode: "273" },
      { title: "طولانی", equivalentHours: 12, shiftCode: "345" },
      { title: "شب", equivalentHours: 8, shiftCode: "121" },
      { title: "۲۴ ساعته تعطیل", equivalentHours: 24, shiftCode: "274" }
    ];

    for (const shift of defaultShifts) {
      await db.insert(workShifts).values(shift).onConflictDoNothing();
    }

    console.log("✅ شیفت‌های پیش‌فرض ایجاد شد");

    // Create default bases
    const defaultBases = [
      { name: "پایگاه ۱۰۱", number: "101", type: "urban" },
      { name: "پایگاه ۱۰۲", number: "102", type: "road" },
      { name: "پایگاه ۱۰۳", number: "103", type: "urban" }
    ];

    for (const base of defaultBases) {
      await db.insert(bases).values(base).onConflictDoNothing();
    }

    console.log("✅ پایگاه‌های پیش‌فرض ایجاد شد");

    // Create 4 default personnel for system testing
    const defaultPersonnel = [
      {
        firstName: "علی",
        lastName: "محمدی",
        nationalId: "1234567890",
        employmentStatus: "official" as const,
        productivityStatus: "productive" as const, 
        driverStatus: "driver" as const
      },
      {
        firstName: "حسن",
        lastName: "احمدی", 
        nationalId: "1234567891",
        employmentStatus: "contractual" as const,
        productivityStatus: "productive" as const,
        driverStatus: "non_driver" as const
      },
      {
        firstName: "محمد",
        lastName: "رضایی",
        nationalId: "1234567892", 
        employmentStatus: "official" as const,
        productivityStatus: "productive" as const,
        driverStatus: "driver" as const
      },
      {
        firstName: "احمد",
        lastName: "حسینی",
        nationalId: "1234567893",
        employmentStatus: "contractual" as const, 
        productivityStatus: "non_productive" as const,
        driverStatus: "non_driver" as const
      }
    ];

    const createdPersonnel = [];
    for (const person of defaultPersonnel) {
      const [created] = await db.insert(personnel).values(person).onConflictDoNothing().returning();
      if (created) createdPersonnel.push(created);
    }

    console.log("✅ پرسنل پیش‌فرض ایجاد شد");

    // Create base profile for ems user (if it doesn't exist)
    if (emsUser || emsUser?.id) {
      const userId = emsUser?.id || (await db.select().from(users).where(eq(users.username, "ems")))[0]?.id;
      
      if (userId) {
        await db.insert(baseProfiles).values({
          userId: userId,
          supervisorName: "سرپرست پایگاه اورژانس",
          supervisorNationalId: "0987654321", 
          baseName: "پایگاه ۱۰۱",
          baseNumber: "101",
          baseType: "urban",
          digitalSignature: null,
          isComplete: true
        }).onConflictDoNothing();

        console.log("✅ پروفایل پایگاه برای کاربر ems ایجاد شد");

        // Add default base members for ems user (first two personnel)
        if (createdPersonnel.length >= 2) {
          for (let i = 0; i < 2; i++) {
            if (createdPersonnel[i]) {
              await db.insert(baseMembers).values({
                userId: userId,
                personnelId: createdPersonnel[i].id
              }).onConflictDoNothing();
            }
          }
          console.log("✅ اعضای پیش‌فرض پایگاه برای کاربر ems اضافه شد");
        }
      }
    }

    console.log("🎉 seed کردن دیتابیس با موفقیت تمام شد!");

  } catch (error) {
    console.error("❌ خطا در seed کردن دیتابیس:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}