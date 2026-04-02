import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const CHAT_SYSTEM_PROMPT = `你是一位专业的营养师和健身教练，专门帮助用户解决增重相关的问题。

你的知识来源于以下权威指南：
- 《体重管理指导原则（2024年版）》国家卫生健康委员会
- 《消瘦诊治与管理专家共识（2025）》中国老年医学学会
- ACSM《健康成人阻力训练的渐进模式》美国运动医学会
- Mayo Clinic 健康增重指南
- 中国营养学会全民营养周体重管理工具包

回答要求：
1. 科学准确，有循证医学依据
2. 通俗易懂，避免过多专业术语
3. 实用性强，给出可操作的建议
4. 语气友好、鼓励性强
5. 如果问题超出增重范围，说明无法回答
6. 回答简洁，控制在200字以内`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId } = body;

    if (!message) {
      return NextResponse.json(
        { error: '缺少消息内容' },
        { status: 400 }
      );
    }

    // 初始化 LLM 客户端
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const llmClient = new LLMClient(config, customHeaders);

    // 如果有 userId，获取用户信息用于个性化回答
    let userContext = '';
    if (userId) {
      try {
        const client = getSupabaseClient();
        const { data: userProfile } = await client
          .from('user_profiles')
          .select('weight, target_weight, ai_plan, exercise_level')
          .eq('id', userId)
          .maybeSingle();

        if (userProfile) {
          userContext = `\n\n用户背景信息：
- 当前体重：${userProfile.weight} kg
- 目标体重：${userProfile.target_weight} kg
- 运动水平：${userProfile.exercise_level}`;
        }
      } catch (error) {
        // 忽略错误，继续使用通用回答
      }
    }

    const messages = [
      { role: 'system' as const, content: CHAT_SYSTEM_PROMPT + userContext },
      { role: 'user' as const, content: message }
    ];

    const response = await llmClient.invoke(messages, {
      model: 'doubao-seed-1-6-lite-251015',
      temperature: 0.7,
    });

    return NextResponse.json({ response: response.content });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
