'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Weight, Scale, Calendar, User, Dumbbell, Utensils, Target } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    age: '',
    gender: '',
    exercise_level: '',
    dietary_preference: '',
    weight_goal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 保存用户信息到数据库
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('保存用户信息失败');
      }

      const { userId } = await response.json();

      // 跳转到方案生成页面
      router.push(`/plan?userId=${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Weight className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI 科学增重助手
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            基于权威循证医学指南，为你定制专属增重方案
          </p>
        </div>

        {/* Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="w-6 h-6" />
              基础信息录入
            </CardTitle>
            <CardDescription className="text-blue-100">
              填写以下信息，AI 将为你生成个性化的科学增重方案
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height" className="flex items-center gap-2 text-base font-medium">
                    <Scale className="w-4 h-4 text-blue-500" />
                    身高 (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    placeholder="例如: 175"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="flex items-center gap-2 text-base font-medium">
                    <Weight className="w-4 h-4 text-purple-500" />
                    当前体重 (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="例如: 55"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2 text-base font-medium">
                    <Calendar className="w-4 h-4 text-green-500" />
                    年龄
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="例如: 25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <User className="w-4 h-4 text-orange-500" />
                    性别
                  </Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="font-normal">男性</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="font-normal">女性</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* 运动基础 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Dumbbell className="w-4 h-4 text-red-500" />
                  运动基础
                </Label>
                <Select
                  value={formData.exercise_level}
                  onValueChange={(value) => setFormData({ ...formData, exercise_level: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="选择你的运动基础水平" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无运动习惯</SelectItem>
                    <SelectItem value="light">轻度运动（每周1-2次）</SelectItem>
                    <SelectItem value="moderate">中度运动（每周3-4次）</SelectItem>
                    <SelectItem value="heavy">重度运动（每周5次以上）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 饮食偏好 */}
              <div className="space-y-2">
                <Label htmlFor="dietary" className="flex items-center gap-2 text-base font-medium">
                  <Utensils className="w-4 h-4 text-yellow-500" />
                  饮食偏好与限制
                </Label>
                <Textarea
                  id="dietary"
                  placeholder="例如：素食、乳糖不耐受、喜欢吃米饭等（选填）"
                  value={formData.dietary_preference}
                  onChange={(e) => setFormData({ ...formData, dietary_preference: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              {/* 增重诉求 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Target className="w-4 h-4 text-indigo-500" />
                  增重诉求
                </Label>
                <Select
                  value={formData.weight_goal}
                  onValueChange={(value) => setFormData({ ...formData, weight_goal: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="选择你的增重目标速度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">温和增重（每月0.5-1kg）</SelectItem>
                    <SelectItem value="moderate">适度增重（每月1-2kg）</SelectItem>
                    <SelectItem value="aggressive">积极增重（每月2kg以上）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    AI 正在生成方案...
                  </>
                ) : (
                  '生成我的增重方案'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>基于《体重管理指导原则（2024年版）》《ACSM阻力训练指南》等权威文献</p>
        </div>
      </div>
    </div>
  );
}
