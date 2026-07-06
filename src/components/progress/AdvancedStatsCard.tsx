import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Users, Download, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdvancedStats, exportStudySessionsCSV } from '@/hooks/useAdvancedStats';
import { toast } from '@/components/ui/sonner';

interface Props {
  userId?: string;
  groupId?: string;
}

export default function AdvancedStatsCard({ userId, groupId }: Props) {
  const { stats, loading } = useAdvancedStats(userId, groupId);

  const handleExport = async () => {
    if (!userId) return;
    try {
      const csv = await exportStudySessionsCSV(userId);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'historico-de-estudos.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Não foi possível exportar seus dados agora.');
    }
  };

  const comparisonDiff =
    stats.groupAverageMinutesThisMonth !== null && stats.groupAverageMinutesThisMonth > 0
      ? Math.round(
          ((stats.userMinutesThisMonth - stats.groupAverageMinutesThisMonth) /
            stats.groupAverageMinutesThisMonth) *
            100
        )
      : null;

  if (loading) return null;

  return (
    <Card className="bg-gradient-to-br from-amber-50/50 to-card border-amber-300/40 dark:from-amber-950/10 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Estatísticas Avançadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparação com o grupo */}
        {stats.groupAverageMinutesThisMonth !== null && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Você vs. média do grupo (este mês)</p>
                <p className="text-xs text-muted-foreground">
                  Você: {stats.userMinutesThisMonth} min • Grupo: {stats.groupAverageMinutesThisMonth} min
                </p>
              </div>
            </div>
            {comparisonDiff !== null && (
              <span className={`text-sm font-bold ${comparisonDiff >= 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {comparisonDiff >= 0 ? '+' : ''}{comparisonDiff}%
              </span>
            )}
          </div>
        )}

        {/* Padrão por dia da semana */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">
              Seu padrão de estudo (últimos 90 dias)
              {stats.bestWeekday && (
                <span className="text-muted-foreground font-normal"> — melhor dia: {stats.bestWeekday}</span>
              )}
            </p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekdayPattern} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                <XAxis dataKey="day" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value) => [`${value} min`, 'Tempo de estudo']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendência mensal */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Tendência dos últimos 6 meses</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                <XAxis dataKey="month" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value) => [`${value} min`, 'Tempo de estudo']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar histórico (CSV)
        </Button>
      </CardContent>
    </Card>
  );
}
