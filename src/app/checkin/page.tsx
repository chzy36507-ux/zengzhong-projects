'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, Scale, Utensils, Dumbbell, MessageCircle, Calendar, TrendingUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CheckInData {
  morning_weight: string;
  diet_execution: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
    notes: string;
  };
  training_completion: {
    completed: boolean;
    exercises: string[];
    notes: string;
  };
}

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);

  const [formData, setFormData] = useState<CheckInData>({
    morning_weight: '',
    diet_execution: {
      breakfast: false,
      lunch: false,
      dinner: false,
      snacks: false,
      notes: '',
    },
    training_completion: {
      completed: false,
      exercises: [],
      notes: '',
    },
  });

  const [currentDate] = useState(new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }));

  useEffect(() => {
    if (!userId) {
      setError('缺少用户ID');
      return;
    }
    checkTodayCheckIn();
  }, [userId]);

  const checkTodayCheckIn = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/checkin/status?userId=${userId}&date=${today}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.checked_in) {
          setCheckedIn(true);
          setAiFeedback(data.ai_feedback || '今日已完成打卡！');
        }
      }
    } catch (err) {
      console.error('检查打卡状态失败:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '打卡失败');
      }

      const data = await response.json();
      setAiFeedback(data.ai_feedback);
      setSuccess(true);
      setCheckedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '打卡失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (checkedIn && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="max-w-2xl w-full mx-4 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-2" />
            <CardTitle className="text-2xl">今日已完成打卡</CardTitle>
            <CardDescription className="text-green-100">{currentDate}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {aiFeedback && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  AI 助手反馈
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiFeedback}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push(`/progress?userId=${userId}`)}>
                <TrendingUp className="w-4 h-4 mr-2" />
                查看进度
              </Button>
              <Button variant="outline" onClick={() => router.push(`/plan?userId=${userId}`)}>
                查看方案
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            每日增重打卡
          </h1>
          <p className="text-gray-600 dark:text-gray-300">{currentDate}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-2" />
              <CardTitle className="text-2xl">打卡成功！</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {aiFeedback && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    AI 助手反馈
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{aiFeedback}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push(`/progress?userId=${userId}`)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  查看进度
                </Button>
                <Button variant="outline" onClick={() => setSuccess(false)}>
                  继续打卡
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 晨起体重 */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-6 h-6" />
                  晨起体重（必填）
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="请输入今晨体重"
                    value={formData.morning_weight}
                    onChange={(e) => setFormData({ ...formData, morning_weight: e.target.value })}
                    required
                    className="text-lg h-12"
                  />
                  <span className="text-lg text-gray-600 dark:text-gray-400">kg</span>
                </div>
              </CardContent>
            </Card>

            {/* 饮食执行情况 */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-6 h-6" />
                  饮食执行情况（必填）
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="breakfast"
                        checked={formData.diet_execution.breakfast}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            diet_execution: { ...formData.diet_execution, breakfast: checked as boolean }
                          })
                        }
                      />
                      <Label htmlFor="breakfast" className="text-base">早餐</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="lunch"
                        checked={formData.diet_execution.lunch}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            diet_execution: { ...formData.diet_execution, lunch: checked as boolean }
                          })
                        }
                      />
                      <Label htmlFor="lunch" className="text-base">午餐</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="dinner"
                        checked={formData.diet_execution.dinner}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            diet_execution: { ...formData.diet_execution, dinner: checked as boolean }
                          })
                        }
                      />
                      <Label htmlFor="dinner" className="text-base">晚餐</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="snacks"
                        checked={formData.diet_execution.snacks}
                        onCheckedChange={(checked) => 
                          setFormData({
                            ...formData,
                            diet_execution: { ...formData.diet_execution, snacks: checked as boolean }
                          })
                        }
                      />
                      <Label htmlFor="snacks" className="text-base">加餐</Label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="diet-notes" className="text-base">饮食备注（选填）</Label>
                    <Textarea
                      id="diet-notes"
                      placeholder="记录今天的饮食情况，如：吃了什么、是否有饱腹感等"
                      value={formData.diet_execution.notes}
                      onChange={(e) => 
                        setFormData({
                          ...formData,
                          diet_execution: { ...formData.diet_execution, notes: e.target.value }
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 训练完成情况 */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-6 h-6" />
                  训练完成情况（选填）
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="training-completed"
                      checked={formData.training_completion.completed}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          training_completion: { ...formData.training_completion, completed: checked as boolean }
                        })
                      }
                    />
                    <Label htmlFor="training-completed" className="text-base font-medium">今天完成了训练</Label>
                  </div>
                  <div>
                    <Label htmlFor="training-notes" className="text-base">训练备注</Label>
                    <Textarea
                      id="training-notes"
                      placeholder="记录今天的训练内容，如：做了哪些动作、训练强度如何"
                      value={formData.training_completion.notes}
                      onChange={(e) => 
                        setFormData({
                          ...formData,
                          training_completion: { ...formData.training_completion, notes: e.target.value }
                        })
                      }
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !formData.morning_weight}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  AI 正在分析打卡数据...
                </>
              ) : (
                '完成打卡'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-green-500" />
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckInContent />
    </Suspense>
  );
}
