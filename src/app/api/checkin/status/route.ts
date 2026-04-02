import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId || !date) {
      return NextResponse.json(
        { error: '缺少参数' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('daily_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('check_in_date', date)
      .maybeSingle();

    if (error) {
      console.error('查询打卡状态失败:', error);
      return NextResponse.json(
        { error: '查询打卡状态失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checked_in: !!data,
      ai_feedback: data?.ai_feedback || null,
    });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
