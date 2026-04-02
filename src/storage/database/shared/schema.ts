import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, index, numeric, date, serial } from "drizzle-orm/pg-core";

// 用户信息表 - 存储用户基本信息和增重方案
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    height: numeric("height", { precision: 5, scale: 2 }).notNull(), // 身高(cm)
    weight: numeric("weight", { precision: 5, scale: 2 }).notNull(), // 当前体重(kg)
    age: integer("age").notNull(),
    gender: varchar("gender", { length: 10 }).notNull(), // 'male' | 'female'
    exercise_level: varchar("exercise_level", { length: 20 }).notNull(), // 运动基础：'none' | 'light' | 'moderate' | 'heavy'
    dietary_preference: text("dietary_preference"), // 饮食偏好描述
    weight_goal: varchar("weight_goal", { length: 20 }).notNull(), // 增重诉求：'mild' | 'moderate' | 'aggressive'
    target_weight: numeric("target_weight", { precision: 5, scale: 2 }), // 目标体重(kg)
    ai_plan: jsonb("ai_plan"), // AI 生成的增重方案（JSON格式）
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("user_profiles_created_at_idx").on(table.created_at),
  ]
);

// 打卡记录表 - 存储每日打卡数据
export const dailyCheckIns = pgTable(
  "daily_check_ins",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    check_in_date: date("check_in_date").notNull(), // 打卡日期
    morning_weight: numeric("morning_weight", { precision: 5, scale: 2 }), // 晨起体重
    diet_execution: jsonb("diet_execution"), // 饮食执行情况（JSON）
    training_completion: jsonb("training_completion"), // 训练完成情况（JSON）
    ai_feedback: text("ai_feedback"), // AI 反馈
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("daily_check_ins_user_id_idx").on(table.user_id),
    index("daily_check_ins_date_idx").on(table.check_in_date),
    index("daily_check_ins_user_date_idx").on(table.user_id, table.check_in_date),
  ]
);

// 体重记录表 - 存储体重变化数据（用于生成趋势图）
export const weightRecords = pgTable(
  "weight_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 }).notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
    record_date: date("record_date").notNull(), // 记录日期
    weight: numeric("weight", { precision: 5, scale: 2 }).notNull(), // 体重(kg)
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("weight_records_user_id_idx").on(table.user_id),
    index("weight_records_date_idx").on(table.record_date),
    index("weight_records_user_date_idx").on(table.user_id, table.record_date),
  ]
);

// 系统健康检查表（必须保留）
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
