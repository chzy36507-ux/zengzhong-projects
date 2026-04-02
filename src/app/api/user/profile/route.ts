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

    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('获取用户信息失败:', error);
      return NextResponse.json(
        { error: '获取用户信息失败' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { height, weight, age, gender, exercise_level, dietary_preference, weight_goal } = body;

    // 验证必填字段
    if (!height || !weight || !age || !gender || !exercise_level || !weight_goal) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 保存用户信息到数据库
    const { data, error } = await client
      .from('user_profiles')
      .insert({
        height: height.toString(),
        weight: weight.toString(),
        age: parseInt(age),
        gender,
        exercise_level,
        dietary_preference: dietary_preference || null,
        weight_goal,
      })
      .select('id')
      .single();

    if (error) {
      console.error('保存用户信息失败:', error);
      return NextResponse.json(
        { error: '保存用户信息失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ userId: data.id });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
