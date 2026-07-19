import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';

interface StoredTimerState {
  accumulatedSeconds: number;
  isRunning: boolean;
  startEpoch: number | null;
  selectedSubject: string;
  selectedGroup: string;
}

interface TimerContextType {
  seconds: number;
  isRunning: boolean;
  selectedSubject: string;
  selectedGroup: string;
  setSeconds: (seconds: number) => void;
  setIsRunning: (isRunning: boolean) => void;
  setSelectedSubject: (subject: string) => void;
  setSelectedGroup: (group: string) => void;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMER_STATE_KEY = 'grupoEstudaTimerState';

// Limite de segurança: se o cronômetro ficar rodando continuamente por mais
// tempo que isso (ex: app esquecido aberto/minimizado por horas), ele pausa
// sozinho para não contar tempo indevido. Ajuste este valor se quiser um
// limite diferente.
const MAX_CONTINUOUS_SESSION_HOURS = 4;
const MAX_CONTINUOUS_SESSION_SECONDS = MAX_CONTINUOUS_SESSION_HOURS * 60 * 60;

// Calcula o tempo decorrido a partir do relógio real (Date.now()), em vez de
// depender de "ticks" de setInterval — isso evita perder tempo quando o app
// fica minimizado, com a tela bloqueada, ou em segundo plano no celular,
// já que o navegador/SO pode pausar ou atrasar intervalos nesses casos.
const computeElapsed = (accumulatedSeconds: number, startEpoch: number | null, isRunning: boolean) => {
  if (!isRunning || !startEpoch) return accumulatedSeconds;
  const liveSeconds = Math.floor((Date.now() - startEpoch) / 1000);
  return accumulatedSeconds + Math.max(liveSeconds, 0);
};

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [startEpoch, setStartEpoch] = useState<number | null>(null);
  const [isRunning, setIsRunningState] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const startEpochRef = useRef<number | null>(null);
  startEpochRef.current = startEpoch;
  const autoPausedRef = useRef(false);

  const autoPause = useCallback((cappedSeconds: number) => {
    if (autoPausedRef.current) return;
    autoPausedRef.current = true;

    setAccumulatedSeconds(cappedSeconds);
    setDisplaySeconds(cappedSeconds);
    setStartEpoch(null);
    setIsRunningState(false);

    toast.warning(
      `Cronômetro pausado automaticamente após ${MAX_CONTINUOUS_SESSION_HOURS}h de estudo contínuo. Salve sua sessão ou inicie uma nova.`
    );
  }, []);

  const recalculate = useCallback(() => {
    const elapsed = computeElapsed(accumulatedSeconds, startEpochRef.current, isRunning);

    if (isRunning && elapsed >= MAX_CONTINUOUS_SESSION_SECONDS) {
      autoPause(MAX_CONTINUOUS_SESSION_SECONDS);
      return;
    }

    setDisplaySeconds(elapsed);
  }, [accumulatedSeconds, isRunning, autoPause]);

  // Carrega o estado salvo e recalcula o tempo decorrido de verdade,
  // mesmo que o app tenha ficado fechado/minimizado por um tempo.
  useEffect(() => {
    const oldData = localStorage.getItem('studyBoostTimerState');
    if (oldData && !localStorage.getItem(TIMER_STATE_KEY)) {
      localStorage.setItem(TIMER_STATE_KEY, oldData);
    }

    const saved = localStorage.getItem(TIMER_STATE_KEY);
    if (!saved) return;

    try {
      const parsed: Partial<StoredTimerState> & { seconds?: number } = JSON.parse(saved);
      // Compatibilidade com o formato antigo (que só guardava "seconds")
      const restoredAccumulated = parsed.accumulatedSeconds ?? parsed.seconds ?? 0;
      const restoredRunning = parsed.isRunning ?? false;
      const restoredStartEpoch = parsed.startEpoch ?? (restoredRunning ? Date.now() : null);

      setAccumulatedSeconds(restoredAccumulated);
      setIsRunningState(restoredRunning);
      setStartEpoch(restoredStartEpoch);
      setSelectedSubject(parsed.selectedSubject || '');
      setSelectedGroup(parsed.selectedGroup || '');
      setDisplaySeconds(computeElapsed(restoredAccumulated, restoredStartEpoch, restoredRunning));
    } catch {
      // Estado salvo corrompido — ignora e começa do zero
    }
  }, []);

  // Persiste o estado bruto (não o tempo exibido) para sobreviver a reloads
  useEffect(() => {
    if (isRunning || accumulatedSeconds > 0) {
      const state: StoredTimerState = {
        accumulatedSeconds,
        isRunning,
        startEpoch,
        selectedSubject,
        selectedGroup,
      };
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(TIMER_STATE_KEY);
    }
  }, [accumulatedSeconds, isRunning, startEpoch, selectedSubject, selectedGroup]);

  // Atualiza o tempo exibido a cada segundo enquanto estiver rodando —
  // sempre recalculando a partir do timestamp real, nunca só incrementando.
  useEffect(() => {
    recalculate();

    if (isRunning) {
      intervalRef.current = window.setInterval(recalculate, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, recalculate]);

  // Recalcula assim que o app volta a ficar visível/em foco, sem esperar
  // até 1s do próximo tick — corrige a exibição na hora em que a pessoa volta
  // de ter minimizado o app ou bloqueado a tela.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recalculate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', recalculate);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', recalculate);
    };
  }, [recalculate]);

  // Protege sessões em andamento de saídas acidentais da página antes de salvar
  useEffect(() => {
    const hasPendingSession = displaySeconds > 0;
    if (!hasPendingSession) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [displaySeconds]);

  const setIsRunning = (running: boolean) => {
    if (running) {
      // Começa a contar a partir de agora, preservando o que já tinha acumulado antes
      autoPausedRef.current = false;
      setStartEpoch(Date.now());
      setIsRunningState(true);
    } else {
      // Congela o tempo decorrido até este instante e para de contar
      setAccumulatedSeconds(prev => computeElapsed(prev, startEpochRef.current, true));
      setStartEpoch(null);
      setIsRunningState(false);
    }
  };

  const setSeconds = (value: number) => {
    setAccumulatedSeconds(value);
    setDisplaySeconds(value);
    if (isRunning) {
      setStartEpoch(Date.now());
    }
  };

  const resetTimer = () => {
    autoPausedRef.current = false;
    setAccumulatedSeconds(0);
    setStartEpoch(null);
    setIsRunningState(false);
    setDisplaySeconds(0);
    localStorage.removeItem(TIMER_STATE_KEY);
  };

  return (
    <TimerContext.Provider
      value={{
        seconds: displaySeconds,
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
