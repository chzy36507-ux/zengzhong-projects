import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 获取最近30天的体重记录
    const { data, error } = await client
      .from('weight_records')
      .select('record_date, weight')
      .eq('user_id', userId)
      .order('record_date', { ascending: true })
      .limit(30);

    if (error) {
      console.error('获取体重记录失败:', error);
      return NextResponse.json(
        { error: '获取体重记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ records: data || [] });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
