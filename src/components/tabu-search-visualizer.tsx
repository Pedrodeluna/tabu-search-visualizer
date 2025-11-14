"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SolutionPlot } from "@/components/solution-plot";
import { SolutionPanel } from "@/components/solution-panel";
import { performStep, generateInitialState, type TabuState, generateNeighbors } from "@/lib/tabu-search";
import { Loader2 } from "lucide-react";

const TABU_LIST_SIZE = 6;

export default function TabuSearchVisualizer() {
  const [history, setHistory] = useState<TabuState[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);
  
  const initialState = useMemo(() => {
    const state = generateInitialState();
    // Pre-calculate neighbors for the initial state for visualization
    return {
      ...state,
      neighbors: generateNeighbors(state.currentSolution.point)
    };
  }, []);

  const resetVisualization = useCallback(() => {
    setHistory([initialState]);
    setCurrentStep(0);
  }, [initialState]);

  useEffect(() => {
    setIsClient(true);
    resetVisualization();
  }, [resetVisualization]);

  const handleForward = useCallback(() => {
    if (currentStep < history.length - 1) {
      setCurrentStep(step => step + 1);
      return;
    }
    const currentState = history[history.length - 1];
    if (!currentState) return;
    const nextState = performStep(currentState, TABU_LIST_SIZE);
    setHistory(prev => [...prev, nextState]);
    setCurrentStep(history.length);
  }, [currentStep, history]);

  const handleBackward = useCallback(() => {
    setCurrentStep(step => Math.max(0, step - 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        handleForward();
      } else if (event.key === "ArrowLeft" || event.key === "Backspace") {
        event.preventDefault();
        handleBackward();
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetVisualization();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleForward, handleBackward, resetVisualization]);

  const currentState = history[currentStep];

  if (!isClient || !currentState) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-semibold text-foreground">Loading Visualizer...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8 h-screen max-h-screen overflow-hidden bg-background">
      <div className="lg:col-span-2 h-full flex items-center justify-center">
        <SolutionPlot state={currentState} />
      </div>
      <div className="lg:col-span-1 h-full py-4">
        <SolutionPanel
          currentSolution={currentState.currentSolution}
          bestSolution={currentState.bestSolution}
          tabuList={currentState.tabuList}
          step={currentStep}
          onNext={handleForward}
          onPrev={handleBackward}
          onReset={resetVisualization}
        />
      </div>
    </div>
  );
}
