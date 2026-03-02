
import React, { useState } from 'react';
import { Trophy, Users, RefreshCw } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { PremiumBadge } from '@/components/premium/PremiumBadge';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('week');
  const [leaderboardType, setLeaderboardType] = useState('global');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const { globalLeaderboard, groupLeaderboards, loading, refreshData } = useLeaderboardData(timeRange);
  
  // Set default selected group when data loads
  React.useEffect(() => {
    if (groupLeaderboards.length > 0 && !selectedGroup) {
      setSelectedGroup(groupLeaderboards[0].id);
    }
  }, [groupLeaderboards, selectedGroup]);
  
  const currentGroup = groupLeaderboards.find(group => group.id === selectedGroup);
  
  // Determine which user list to show based on selected type
  const userList = leaderboardType === 'global' 
    ? globalLeaderboard 
    : currentGroup?.members || [];
  
  return (
    <PageLayout>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('leaderboard.title')}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <Tabs value={leaderboardType} onValueChange={setLeaderboardType} className="w-auto">
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger value="global" className="flex items-center">
                <Trophy size={14} className="mr-1" />
                <span>{t('leaderboard.global')}</span>
              </TabsTrigger>
              <TabsTrigger value="group" className="flex items-center">
                <Users size={14} className="mr-1" />
                <span>{t('leaderboard.group')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
            <TabsList className="grid grid-cols-3 h-9">
              <TabsTrigger value="week" className="text-xs px-2">{t('leaderboard.week')}</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">{t('leaderboard.month')}</TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-2">{t('leaderboard.allTime')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {leaderboardType === 'group' && groupLeaderboards.length > 0 && (
          <div className="mb-4">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger>
                <SelectValue placeholder={t('leaderboard.selectGroup')} />
              </SelectTrigger>
              <SelectContent>
                {groupLeaderboards.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 rounded-full mr-3" />
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                <Skeleton className="w-5 h-5" />
              </CardContent>
            </Card>
          ))
        ) : userList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Trophy size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
              <p className="text-sm">
                {leaderboardType === 'global' 
                  ? 'Não há rankings globais ainda.'
                  : 'Não há rankings para este grupo ainda.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          userList.map((user) => {
            const getRankColor = (rank: number) => {
              if (rank === 1) return 'bg-yellow-500';
              if (rank === 2) return 'bg-gray-400';
              if (rank === 3) return 'bg-amber-700';
              return 'bg-gray-200 text-gray-700';
            };
            
            return (
              <Card key={user.id} className={`${user.isCurrentUser ? 'border-primary border-2' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full ${getRankColor(user.rank)} flex items-center justify-center text-white font-bold mr-3`}>
                      {user.rank}
                    </div>
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {user.name}
                          {(user as any).plan === 'premium' && <PremiumBadge size="sm" />}
                          {user.isCurrentUser && <span className="text-xs ml-1 text-primary">(Você)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.points} pontos
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {user.rank <= 3 && (
                    <Trophy 
                      size={20} 
                      className={`
                        ${user.rank === 1 ? 'text-yellow-500' : ''}
                        ${user.rank === 2 ? 'text-gray-400' : ''}
                        ${user.rank === 3 ? 'text-amber-700' : ''}
                      `} 
                    />
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PageLayout>
  );
};

export default Leaderboard;
