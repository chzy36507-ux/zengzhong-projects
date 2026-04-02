'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Target, Flame, Apple, Dumbbell, ArrowRight, CheckCircle } from 'lucide-react';

interface AIPlan {
  analysis: {
    bmi: number;
    bmi_status: string;
    ideal_weight_range: string;
    target_weight: string;
  };
  daily_calories: {
    bmr: number;
    tdee: number;
    target_calories: number;
    calories_surplus: string;
  };
  macros: {
    carbs: string;
    protein: string;
    fat: string;
  };
  diet_principles: {
    meals_per_day: string;
    key_foods: string[];
    tips: string[];
  };
  training_principles: {
    frequency: string;
    type: string;
    key_exercises: string[];
  };
}

function PlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<AIPlan | null>(null);
  const [targetWeight, setTargetWeight] = useState<string>('');

  useEffect(() => {
    if (!userId) {
      setError('缺少用户ID');
      setLoading(false);
      return;
    }

    generatePlan();
  }, [userId]);

  const generatePlan = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '生成方案失败');
      }

      const data = await response.json();
      setPlan(data.plan);
      
      // 获取目标体重
      const profileResponse = await fetch(`/api/user/profile?userId=${userId}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setTargetWeight(profileData.target_weight);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成方案失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-xl text-gray-700 dark:text-gray-300">AI 正在为你生成专属增重方案...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">基于权威医学指南，请稍候</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <Button onClick={generatePlan}>重新生成</Button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            你的专属增重方案
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            基于《体重管理指导原则（2024年版）》等权威指南生成
          </p>
        </div>

        {/* 身体状况分析 */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              身体状况分析
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">BMI 指数</p>
                <p className="text-3xl font-bold text-blue-600">{plan.analysis.bmi.toFixed(1)}</p>
                <p className="text-sm text-gray-500 mt-1">{plan.analysis.bmi_status}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">理想体重范围</p>
                <p className="text-lg font-bold text-green-600">{plan.analysis.ideal_weight_range}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">目标体重</p>
                <p className="text-3xl font-bold text-purple-600">{targetWeight} kg</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">增重目标</p>
                <p className="text-lg font-bold text-orange-600">{plan.analysis.target_weight}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 热量目标 & 宏量营养素 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-6 h-6" />
                每日热量目标
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-600 dark:text-gray-400">基础代谢率 (BMR)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{plan.daily_calories.bmr} kcal</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-gray-600 dark:text-gray-400">每日总消耗 (TDEE)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{plan.daily_calories.tdee} kcal</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg">
                  <span className="font-semibold text-gray-900 dark:text-white">每日目标摄入</span>
                  <span className="text-2xl font-bold text-orange-600">{plan.daily_calories.target_calories} kcal</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{plan.daily_calories.calories_surplus}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-6 h-6" />
                宏量营养素配比
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">碳水化合物</span>
                    <span className="text-lg font-bold text-yellow-600">{plan.macros.carbs}</span>
                  </div>
                  <div className="w-full bg-yellow-200 dark:bg-yellow-900 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">蛋白质</span>
                    <span className="text-lg font-bold text-red-600">{plan.macros.protein}</span>
                  </div>
                  <div className="w-full bg-red-200 dark:bg-red-900 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">脂肪</span>
                    <span className="text-lg font-bold text-blue-600">{plan.macros.fat}</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 饮食原则 & 训练原则 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-6 h-6" />
                饮食原则
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">每日餐次</h3>
                  <p className="text-gray-600 dark:text-gray-400">{plan.diet_principles.meals_per_day}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">推荐食物</h3>
                  <div className="flex flex-wrap gap-2">
                    {plan.diet_principles.key_foods.map((food, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">实用建议</h3>
                  <ul className="space-y-2">
                    {plan.diet_principles.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-6 h-6" />
                训练原则
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">训练频率</h3>
                  <p className="text-gray-600 dark:text-gray-400">{plan.training_principles.frequency}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">训练类型</h3>
                  <p className="text-gray-600 dark:text-gray-400">{plan.training_principles.type}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">关键动作</h3>
                  <div className="flex flex-wrap gap-2">
                    {plan.training_principles.key_exercises.map((exercise, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                      >
                        {exercise}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push(`/checkin?userId=${userId}`)}
            className="h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            开始每日打卡
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            onClick={() => router.push(`/progress?userId=${userId}`)}
            variant="outline"
            className="h-14 text-lg font-semibold"
          >
            查看进度追踪
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-xl text-gray-700 dark:text-gray-300">加载中...</p>
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PlanContent />
    </Suspense>
  );
}
