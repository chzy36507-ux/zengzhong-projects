'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BookOpen, MessageCircle, Send, ArrowRight, CheckCircle, Lightbulb, AlertTriangle, Heart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const KNOWLEDGE_BASE = [
  {
    category: '增重基础',
    icon: Lightbulb,
    items: [
      {
        title: '什么是健康增重？',
        content: '健康增重是指在保证营养均衡的前提下，通过增加肌肉量和适量脂肪来达到理想体重，而非单纯暴饮暴食导致的脂肪堆积。科学的增重目标是每月增加 0.5-2kg。',
      },
      {
        title: 'BMI 多少算消瘦？',
        content: 'BMI（身体质量指数）= 体重(kg) / 身高(m)²。根据中国标准，BMI < 18.5 为消瘦，18.5-23.9 为正常，24-27.9 为超重，≥ 28 为肥胖。',
      },
      {
        title: '为什么我怎么吃都不胖？',
        content: '消瘦原因包括：①遗传因素导致基础代谢率高；②饮食热量摄入不足；③消化吸收功能不佳；④运动消耗过大；⑤某些疾病或药物影响。建议先排除疾病因素，再通过科学饮食和训练增重。',
      },
    ],
  },
  {
    category: '饮食建议',
    icon: Heart,
    items: [
      {
        title: '增重每天需要多少热量？',
        content: '增重需要热量盈余，建议每日摄入热量 = TDEE（每日总能量消耗）+ 300-500 kcal。温和增重 +300 kcal，适度增重 +400 kcal，积极增重 +500 kcal。',
      },
      {
        title: '增重应该吃什么？',
        content: '推荐高热量密度食物：坚果（杏仁、核桃）、牛油果、全脂奶制品、橄榄油、花生酱、瘦肉、鸡蛋、全谷物。避免垃圾食品，选择营养密集型食物。',
      },
      {
        title: '增重期间需要吃几餐？',
        content: '建议每日 5-6 餐（3 顿正餐 + 2-3 次加餐），每餐适量，避免一次性大量进食导致消化不良。加餐可选择坚果、酸奶、蛋白棒等。',
      },
    ],
  },
  {
    category: '训练指南',
    icon: CheckCircle,
    items: [
      {
        title: '增重需要运动吗？',
        content: '是的！增重的目标是增加肌肉而非脂肪。力量训练是增重的关键，建议每周 3-4 次，每次 45-60 分钟，重点是大肌群复合动作。',
      },
      {
        title: '哪些训练动作最有效？',
        content: '推荐复合动作：深蹲、硬拉、卧推、推举、引体向上、划船。这些动作能调动多个肌群，促进睾酮分泌，增肌效果最好。',
      },
      {
        title: '训练后怎么吃？',
        content: '训练后 30-60 分钟是营养窗口期，建议补充：蛋白质（乳清蛋白粉、鸡蛋、鸡胸肉）+ 快速碳水（香蕉、白米饭）。训练后不宜空腹，也不要暴饮暴食。',
      },
    ],
  },
  {
    category: '常见误区',
    icon: AlertTriangle,
    items: [
      {
        title: '增重就是多吃？',
        content: '错误！单纯多吃可能导致脂肪堆积、血脂升高、脂肪肝等健康问题。科学增重需要：①热量盈余适中；②蛋白质充足；③力量训练；④循序渐进。',
      },
      {
        title: '增重不能做有氧？',
        content: '不完全正确。适度有氧（每周 2-3 次，每次 20-30 分钟）有益心血管健康，但不宜过量。增重期间应以力量训练为主，有氧为辅。',
      },
      {
        title: '消瘦就一定健康吗？',
        content: '不一定。消瘦可能伴随：免疫力低下、骨质疏松、肌肉量不足、贫血、月经不调等问题。建议消瘦人群进行健康体检，排除潜在疾病。',
      },
    ],
  },
];

function KnowledgeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'AI 响应失败');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 响应失败');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，我暂时无法回答这个问题。请稍后再试。' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            科学增重知识库
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            权威指南 · 常见误区 · AI 答疑
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 知识库 */}
          <div className="space-y-4">
            {KNOWLEDGE_BASE.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.category} className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="w-5 h-5 text-teal-500" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {category.items.map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI 答疑 */}
          <Card className="shadow-lg h-fit sticky top-8">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                AI 增重助手答疑
              </CardTitle>
              <CardDescription className="text-teal-100">
                有任何增重疑问，随时问我
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {error && (
                <Alert variant="destructive" className="m-4 mb-0">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p>开始提问吧</p>
                    <p className="text-sm mt-2">例如：增重期间可以喝酒吗？</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-teal-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t dark:border-gray-700">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入你的问题..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            参考来源：国家卫健委《体重管理指导原则（2024年版）》、ACSM 训练指南等权威文献
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push(`/checkin?userId=${userId}`)}>
              每日打卡
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push(`/progress?userId=${userId}`)}>
              查看进度
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
    </div>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <KnowledgeContent />
    </Suspense>
  );
}
