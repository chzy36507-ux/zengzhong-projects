import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// AI 增重方案生成系统提示词
const SYSTEM_PROMPT = `你是一位专业的营养师和健身教练，精通健康增重科学。你的任务是根据用户的基本信息，生成个性化的科学增重方案。

参考权威指南：
- 《体重管理指导原则（2024年版）》国家卫生健康委员会
- 《消瘦诊治与管理专家共识（2025）》中国老年医学学会
- ACSM《健康成人阻力训练的渐进模式》
- Mayo Clinic 健康增重指南

你需要生成一个详细的增重方案，包含以下内容：

1. **身体状况分析**
   - BMI 计算与评估
   - 理想体重范围
   - 增重目标设定

2. **每日热量目标**
   - 基础代谢率（BMR）
   - 每日总能量消耗（TDEE）
   - 增重所需热量盈余
   - 每日目标热量摄入

3. **宏量营养素配比**
   - 碳水化合物（g/kg/天）
   - 蛋白质（g/kg/天）
   - 脂肪（g/kg/天）

4. **饮食原则**
   - 每日餐次安排
   - 食物选择建议
   - 热量密度高的健康食物推荐

5. **训练原则**
   - 训练频率
   - 训练类型（力量训练为主）
   - 关键动作推荐

请以 JSON 格式返回，格式如下：
{
  "analysis": {
    "bmi": 数字,
    "bmi_status": "BMI状态描述",
    "ideal_weight_range": "理想体重范围",
    "target_weight": "目标体重"
  },
  "daily_calories": {
    "bmr": 基础代谢率数字,
    "tdee": 每日总能量消耗数字,
    "target_calories": 每日目标热量数字,
    "calories_surplus": "热量盈余说明"
  },
  "macros": {
    "carbs": "碳水化合物建议（克/天）",
    "protein": "蛋白质建议（克/天）",
    "fat": "脂肪建议（克/天）"
  },
  "diet_principles": {
    "meals_per_day": "每日餐次",
    "key_foods": ["食物1", "食物2", "食物3"],
    "tips": ["建议1", "建议2", "建议3"]
  },
  "training_principles": {
    "frequency": "训练频率",
    "type": "训练类型",
    "key_exercises": ["动作1", "动作2", "动作3"]
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 获取用户信息
    const { data: userProfile, error: dbError } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (dbError || !userProfile) {
      return NextResponse.json(
        { error: '用户信息不存在' },
        { status: 404 }
      );
    }

    // 初始化 LLM 客户端
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const llmClient = new LLMClient(config, customHeaders);

    // 构造用户消息
    const userMessage = `请为以下用户生成个性化的科学增重方案：

用户信息：
- 身高：${userProfile.height} cm
- 当前体重：${userProfile.weight} kg
- 年龄：${userProfile.age} 岁
- 性别：${userProfile.gender === 'male' ? '男性' : '女性'}
- 运动基础：${getExerciseLevelText(userProfile.exercise_level)}
- 饮食偏好：${userProfile.dietary_preference || '无特殊偏好'}
- 增重诉求：${getWeightGoalText(userProfile.weight_goal)}

请根据这些信息生成详细的增重方案。`;

    // 调用 AI 生成方案
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userMessage }
    ];

    const response = await llmClient.invoke(messages, {
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.7,
    });

    // 解析 AI 返回的 JSON
    let aiPlan;
    try {
      // 提取 JSON 内容（AI 可能返回带 ```json 包裹的内容）
      const content = response.content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      aiPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('解析 AI 响应失败:', parseError);
      return NextResponse.json(
        { error: 'AI 响应格式错误' },
        { status: 500 }
      );
    }

    // 计算目标体重（如果用户选择积极增重，目标增加 5-10kg）
    const currentWeight = parseFloat(userProfile.weight);
    const targetWeight = currentWeight + (userProfile.weight_goal === 'aggressive' ? 10 : userProfile.weight_goal === 'moderate' ? 7 : 5);

    // 保存 AI 方案到数据库
    const { error: updateError } = await client
      .from('user_profiles')
      .update({
        ai_plan: aiPlan,
        target_weight: targetWeight.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('保存方案失败:', updateError);
      return NextResponse.json(
        { error: '保存方案失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, plan: aiPlan });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

function getExerciseLevelText(level: string): string {
  const levels: Record<string, string> = {
    none: '无运动习惯',
    light: '轻度运动（每周1-2次）',
    moderate: '中度运动（每周3-4次）',
    heavy: '重度运动（每周5次以上）',
  };
  return levels[level] || level;
}

function getWeightGoalText(goal: string): string {
  const goals: Record<string, string> = {
    mild: '温和增重（每月0.5-1kg）',
    moderate: '适度增重（每月1-2kg）',
    aggressive: '积极增重（每月2kg以上）',
  };
  return goals[goal] || goal;
}
