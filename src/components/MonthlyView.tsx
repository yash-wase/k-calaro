import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import type { User, DailySummary } from '../App';

interface MonthlyViewProps {
  currentDate: string;
  onBack: () => void;
}

export function MonthlyView({ currentDate, onBack }: MonthlyViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date(currentDate));

  const userId = 'default_user';

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch user
      const userRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const userData = await userRes.json();
      
      if (userData.success) {
        setUser(userData.user);
      }

      // Fetch monthly summary
      const year = selectedMonth.getFullYear();
      const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
      
      const summaryRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/monthly-summary/${userId}/${year}/${month}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const summaryData = await summaryRes.json();
      
      if (summaryData.success) {
        setSummaries(summaryData.summaries);
      }
    } catch (error) {
      console.error('Error loading monthly data:', error);
      toast.error('Failed to load monthly data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const getSummaryForDate = (day: number): DailySummary | null => {
    const year = selectedMonth.getFullYear();
    const month = String(selectedMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    
    return summaries.find(s => s.summaryDate === dateStr) || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedMonth);
  const dailyLimit = user?.dailyLimitKcal || 2000;

  const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-[var(--text-primary)]">Monthly Summary</h1>
        </div>
      </div>

      {/* Month Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-[var(--text-primary)]">{monthName}</h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-2 text-sm text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const summary = getSummaryForDate(day);
            const totalKcal = summary?.totalKcal || 0;
            const exceedsLimit = totalKcal > dailyLimit;
            const hasData = summary !== null && totalKcal > 0;

            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth();
            const isToday = 
              day === new Date().getDate() &&
              month === new Date().getMonth() &&
              year === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all
                  ${isToday ? 'border-blue-500' : 'border-border'}
                  ${hasData 
                    ? exceedsLimit 
                      ? 'bg-red-50 hover:bg-red-100' 
                      : 'bg-green-50 hover:bg-green-100'
                    : 'bg-[var(--bg-card)] hover:bg-muted'
                  }
                `}
              >
                <div className="flex flex-col h-full justify-between">
                  <div className="text-sm text-[var(--text-primary)]">{day}</div>
                  {hasData && (
                    <div className="text-center">
                      <div className={`text-xs ${exceedsLimit ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.round(totalKcal)}
                      </div>
                      <div className="text-xs text-muted-foreground">kcal</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-6">
        <h3 className="text-[var(--text-primary)] mb-4">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-green-50 border-2 border-gray-200"></div>
            <span className="text-sm text-muted-foreground">Within Limit</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-red-50 border-2 border-gray-200"></div>
            <span className="text-sm text-muted-foreground">Exceeded Limit</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white border-2 border-blue-500"></div>
            <span className="text-sm text-muted-foreground">Today</span>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Daily Limit: <span className="font-semibold">{dailyLimit} kcal</span>
        </div>
      </Card>
    </div>
  );
}
