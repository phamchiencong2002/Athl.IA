// context/OnboardingContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface OnboardingData {
  // Step 1 – Profile
  username: string;
  email: string;
  password: string;
  sex: 'H' | 'F';
  age: string;
  height: number;
  weight: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  // Step 2 – Goals
  goal: string;
  sport: string;
  weekAvailability: number;
  // Step 3 – Body Map
  injuries: string[];
  // Step 4 – Equipment
  locations: string[];
  equipment: string[];
}

const DEFAULT_DATA: OnboardingData = {
  username: '',
  email: '',
  password: '',
  sex: 'H',
  age: '28',
  height: 175,
  weight: 72,
  level: 'intermediate',
  goal: '',
  sport: '',
  weekAvailability: 0,
  injuries: [],
  locations: [],
  equipment: [],
};

interface ContextValue {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

const OnboardingContext = createContext<ContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);

  const update = (partial: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const reset = () => setData(DEFAULT_DATA);

  return (
    <OnboardingContext.Provider value={{ data, update, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}