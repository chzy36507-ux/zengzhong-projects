'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Target, Scale, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface WeightRecord {
  record_date: string;
  weight: number;
}

interface UserProfile {
  weight: string;
  target_weight: string;
  ai_plan: {
    analysis: {
      bmi: number;
      bmi_status: string;
      ideal_weight_range: string;
    };
  };
}

function ProgressContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('缺少用户ID');
      setLoading(false);
      return;
    }
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 获取用户信息
      const profileResponse = await fetch(`/api/user/profile?userId=${userId}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // 获取体重记录
      const weightResponse = await fetch(`/api/weight/records?userId=${userId}`);
      if (weightResponse.ok) {
        const weightData = await weightResponse.json();
        setWeightRecords(weightData.records || []);
      }
    } catch (err) {
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  const currentWeight = weightRecords.length > 0 
    ? weightRecords[weightRecords.length - 1].weight 
    : parseFloat(userProfile?.weight || '0');
  
  const targetWeight = parseFloat(userProfile?.target_weight || '0');
  const startWeight = parseFloat(userProfile?.weight || '0');
  const progress = ((currentWeight - startWeight) / (targetWeight - startWeight) * 100);
  const weightChange = currentWeight - startWeight;

  // 准备图表数据
  const chartData = weightRecords.map(record => ({
    date: new Date(record.record_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
    weight: record.weight,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            增重进度追踪
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            记录你的每一点进步
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">起始体重</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {startWeight.toFixed(1)} kg
                  </p>
                </div>
                <Scale className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">当前体重</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentWeight.toFixed(1)} kg
                  </p>
                </div>
                <Scale className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">目标体重</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {targetWeight.toFixed(1)} kg
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">已增重</p>
                  <p className={`text-2xl font-bold ${weightChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${weightChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 进度条 */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>目标完成进度</CardTitle>
            <CardDescription>
              距离目标还差 {((targetWeight - currentWeight) > 0 ? (targetWeight - currentWeight).toFixed(1) : '0')} kg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{progress.toFixed(1)}% 完成</span>
                <span>{startWeight.toFixed(1)} kg → {targetWeight.toFixed(1)} kg</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 体重趋势图 */}
        {chartData.length > 0 ? (
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                体重变化趋势
              </CardTitle>
              <CardDescription>你的体重记录曲线</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={targetWeight} stroke="#9333ea" strokeDasharray="5 5" label="目标体重" />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                    name="体重 (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">暂无体重记录</p>
                <Button onClick={() => router.push(`/checkin?userId=${userId}`)}>
                  开始每日打卡
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 健康建议 */}
        {userProfile?.ai_plan && (
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                健康状态评估
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">BMI 指数</p>
                  <p className="text-xl font-bold text-blue-600">
                    {userProfile.ai_plan.analysis.bmi.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {userProfile.ai_plan.analysis.bmi_status}
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">理想体重范围</p>
                  <p className="text-lg font-bold text-green-600">
                    {userProfile.ai_plan.analysis.ideal_weight_range}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push(`/checkin?userId=${userId}`)}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            每日打卡
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/knowledge?userId=${userId}`)}
          >
            知识库
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProgressContent />
    </Suspense>
  );
}
