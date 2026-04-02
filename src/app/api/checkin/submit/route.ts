import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const FEEDBACK_PROMPT = `你是一位专业的营养师和健身教练，用户刚刚完成了今天的增重打卡。请根据用户的打卡数据，给出积极、鼓励性的反馈和建议。

要求：
1. 语气友好、鼓励性强
2. 如果体重有变化，给予正面反馈
3. 针对饮食执行情况给出建议
4. 如果完成了训练，给予表扬
5. 如果有未完成的项目，给出改进建议
6. 控制在100-150字以内`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, morning_weight, diet_execution, training_completion } = body;

    if (!userId || !morning_weight) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // 检查今日是否已打卡
    const { data: existingCheckIn } = await client
      .from('daily_check_ins')
      .select('id')
      .eq('user_id', userId)
      .eq('check_in_date', today)
      .maybeSingle();

    if (existingCheckIn) {
      return NextResponse.json(
        { error: '今日已完成打卡' },
        { status: 400 }
      );
    }

    // 获取用户信息和最近的体重记录
    const { data: userProfile } = await client
      .from('user_profiles')
      .select('weight, target_weight, ai_plan')
      .eq('id', userId)
      .single();

    // 获取昨天的体重（用于对比）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayWeight } = await client
      .from('daily_check_ins')
      .select('morning_weight')
      .eq('user_id', userId)
      .eq('check_in_date', yesterdayStr)
      .maybeSingle();

    // 生成 AI 反馈
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const llmClient = new LLMClient(config, customHeaders);

    const userMessage = `用户打卡数据：
- 晨起体重：${morning_weight} kg
- 昨天体重：${yesterdayWeight?.morning_weight || '无记录'} kg
- 初始体重：${userProfile?.weight} kg
- 目标体重：${userProfile?.target_weight} kg
- 饮食执行：早餐${diet_execution.breakfast ? '✓' : '✗'}、午餐${diet_execution.lunch ? '✓' : '✗'}、晚餐${diet_execution.dinner ? '✓' : '✗'}、加餐${diet_execution.snacks ? '✓' : '✗'}
- 饮食备注：${diet_execution.notes || '无'}
- 训练完成：${training_completion.completed ? '是' : '否'}
- 训练备注：${training_completion.notes || '无'}

请给出今天的打卡反馈。`;

    const messages = [
      { role: 'system' as const, content: FEEDBACK_PROMPT },
      { role: 'user' as const, content: userMessage }
    ];

    const response = await llmClient.invoke(messages, {
      model: 'doubao-seed-1-6-lite-251015',
      temperature: 0.8,
    });

    const aiFeedback = response.content;

    // 保存打卡记录
    const { error: checkInError } = await client
      .from('daily_check_ins')
      .insert({
        user_id: userId,
        check_in_date: today,
        morning_weight: morning_weight.toString(),
        diet_execution,
        training_completion,
        ai_feedback: aiFeedback,
      });

    if (checkInError) {
      console.error('保存打卡记录失败:', checkInError);
      return NextResponse.json(
        { error: '保存打卡记录失败' },
        { status: 500 }
      );
    }

    // 保存体重记录
    const { error: weightError } = await client
      .from('weight_records')
      .insert({
        user_id: userId,
        record_date: today,
        weight: morning_weight.toString(),
      });

    if (weightError) {
      console.error('保存体重记录失败:', weightError);
      // 不影响打卡成功，仅记录错误
    }

    return NextResponse.json({ ai_feedback: aiFeedback });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
