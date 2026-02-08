
import React, { useState } from 'react';
import { Droplet, Plus, Minus, Settings } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useWaterData } from '@/hooks/useWaterData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Water: React.FC = () => {
  const { t } = useTranslation();
  const { waterStats, loading, addWaterIntake, removeWaterIntake, updateWaterGoal } = useWaterData();
  const [unitType, setUnitType] = useState('ml');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [customGoal, setCustomGoal] = useState('');

  const handleSaveGoal = () => {
    const goalValue = parseInt(customGoal);
    if (goalValue >= 500 && goalValue <= 5000) {
      updateWaterGoal(goalValue);
      setGoalDialogOpen(false);
      setCustomGoal('');
    }
  };

  const quickGoalPresets = [
    { label: '🪑 Sedentário', value: 2000 },
    { label: '🚶 Moderado', value: 2500 },
    { label: '🏃 Ativo', value: 3000 },
    { label: '🏋️ Muito ativo', value: 3500 },
  ];

  const displayIntake = unitType === 'ml' ? waterStats.todayIntake : (waterStats.todayIntake / 1000).toFixed(1);
  const displayGoal = unitType === 'ml' ? waterStats.dailyGoal : (waterStats.dailyGoal / 1000).toFixed(1);
  const progressPercentage = (waterStats.todayIntake / waterStats.dailyGoal) * 100;
  
  // Convert weekly data based on unit type
  const formattedWeeklyData = waterStats.weeklyData.map(day => ({
    name: day.name,
    intake: unitType === 'ml' ? day.intake : day.intake / 1000
  }));

  if (loading) {
    return (
      <PageLayout>
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">{t('water.title')}</h2>
          <Card className="overflow-hidden mb-6">
            <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 p-6 text-white">
              <div className="relative z-10 flex flex-col items-center">
                <Skeleton className="h-16 w-32 mb-4 bg-white/20" />
                <Skeleton className="h-3 w-52 bg-white/20" />
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-center mb-4">
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="flex justify-center gap-3 mb-2">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
              </div>
              <div className="flex justify-center">
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{t('water.title')}</h2>
        
        <Card className="overflow-hidden mb-6">
          <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 p-6 text-white">
            <div 
              className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYzMCIgc3Ryb2tlLXdpZHRoPSIyIiBkPSJNMCwzMCBDNjAsMzAgOTAsMCA5MCwwIFMxMjAsMzAgMTgwLDMwIEMxODAsMzAgMjEwLDAgMjEwLDAgUzI0MCwzMCAzMDAsMzAgTDMwMCwxMDAgTDAsMTAwIFoiPjwvcGF0aD4KPC9zdmc+Cg==')] opacity-20"
            ></div>
            <div className="absolute top-2 right-2 z-20">
              <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Ajustar Meta Diária de Água</DialogTitle>
                    <DialogDescription>
                      Escolha uma meta pré-definida ou defina uma personalizada (500ml - 5000ml)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Sugestões baseadas em atividade:</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {quickGoalPresets.map((preset) => (
                          <Button
                            key={preset.value}
                            variant="outline"
                            onClick={() => {
                              updateWaterGoal(preset.value);
                              setGoalDialogOpen(false);
                            }}
                            className="h-auto py-3 flex flex-col items-center text-xs"
                          >
                            <span>{preset.label}</span>
                            <span className="font-bold">{preset.value}ml</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-goal">Meta personalizada (ml):</Label>
                      <Input
                        id="custom-goal"
                        type="number"
                        min="500"
                        max="5000"
                        step="100"
                        placeholder="2500"
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveGoal} disabled={!customGoal || parseInt(customGoal) < 500 || parseInt(customGoal) > 5000}>
                      Salvar Meta
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-2 text-center">
                <div className="text-xs text-blue-100">{t('water.todaysIntake')}</div>
                <div className="text-3xl font-bold">{displayIntake} {unitType}</div>
                <div className="text-xs text-blue-100">{t('water.goal')}: {displayGoal} {unitType}</div>
              </div>
              <Progress value={progressPercentage} className="h-3 bg-blue-300/50 w-full max-w-52" />
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-center mb-4">
              <Tabs onValueChange={setUnitType} value={unitType} className="w-40">
                <TabsList className="grid grid-cols-3 h-8">
                  <TabsTrigger value="ml" className="text-xs">ml</TabsTrigger>
                  <TabsTrigger value="L" className="text-xs">L</TabsTrigger>
                  <TabsTrigger value="cup" className="text-xs">Copo</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex justify-center gap-3 mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-14 w-14 rounded-full flex flex-col items-center justify-center"
                onClick={() => addWaterIntake(250)}
              >
                <Droplet size={18} className="text-blue-500 mb-1" />
                <span className="text-xs">+1 Copo</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-14 w-14 rounded-full flex flex-col items-center justify-center"
                onClick={() => addWaterIntake(500)}
              >
                <Droplet size={18} className="text-blue-500 mb-1" />
                <span className="text-xs">+500ml</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-14 w-14 rounded-full flex flex-col items-center justify-center"
                onClick={() => removeWaterIntake(250)}
              >
                <Minus size={18} className="text-red-500 mb-1" />
                <span className="text-xs">-250ml</span>
              </Button>
            </div>
            
            <div className="flex justify-center">
              <Button 
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => addWaterIntake(250)}
              >
                <Plus size={18} className="mr-1" /> {t('water.addWater')}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('water.weeklyIntake')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedWeeklyData} margin={{ top: 20, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}${unitType}`} />
                  <Tooltip 
                    formatter={(value) => [`${value} ${unitType}`, 'Consumo']} 
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="intake" fill="#33C3F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Water;
