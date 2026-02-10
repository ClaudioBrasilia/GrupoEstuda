import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface TimerState {
  seconds: number;
  isRunning: boolean;
  selectedSubject: string;
  selectedGroup: string;
}

interface TimerContextType extends TimerState {
  setSeconds: (seconds: number) => void;
  setIsRunning: (isRunning: boolean) => void;
  setSelectedSubject: (subject: string) => void;
  setSelectedGroup: (group: string) => void;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMER_STATE_KEY = 'grupoEstudaTimerState';

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const intervalRef = useRef<number | null>(null);

  // Load timer state from localStorage on mount
  useEffect(() => {
    // Migrate old data if exists
    const oldData = localStorage.getItem('studyBoostTimerState');
    if (oldData && !localStorage.getItem(TIMER_STATE_KEY)) {
      localStorage.setItem(TIMER_STATE_KEY, oldData);
    }
    
    const savedTimerState = localStorage.getItem(TIMER_STATE_KEY);
    if (savedTimerState) {
      const parsed = JSON.parse(savedTimerState);
      setSeconds(parsed.seconds || 0);
      setIsRunning(parsed.isRunning || false);
      setSelectedSubject(parsed.selectedSubject || '');
      setSelectedGroup(parsed.selectedGroup || '');
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (isRunning || seconds > 0) {
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
        seconds,
        isRunning,
        selectedSubject,
        selectedGroup
      }));
    } else if (seconds === 0) {
      localStorage.removeItem(TIMER_STATE_KEY);
    }
  }, [seconds, isRunning, selectedSubject, selectedGroup]);

  // Handle timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const resetTimer = () => {
    setSeconds(0);
    setIsRunning(false);
    localStorage.removeItem(TIMER_STATE_KEY);
  };

  return (
    <TimerContext.Provider
      value={{
        seconds,
        isRunning,
        selectedSubject,
        selectedGroup,
        setSeconds,
        setIsRunning,
        setSelectedSubject,
        setSelectedGroup,
        resetTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
