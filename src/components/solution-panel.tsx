import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Target, Trophy, List, RefreshCcw, MoveRight, ChevronLeft } from "lucide-react";
import type { Solution, Point } from "@/lib/tabu-search";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface SolutionPanelProps {
  currentSolution: Solution;
  bestSolution: Solution;
  tabuList: Point[];
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
}

const SolutionInfo = ({ title, icon, solution }: { title: string, icon: React.ReactNode, solution: Solution }) => (
    <div>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="font-semibold text-lg text-card-foreground">{title}</h3>
      </div>
      <div className="pl-9 space-y-1">
        <p className="text-muted-foreground text-sm">
          Coords (x, y): <span className="font-mono text-foreground">({solution.point.x.toFixed(2)}, {solution.point.y.toFixed(2)})</span>
        </p>
        <p className="text-muted-foreground text-sm">
          f(x, y) = <span className="font-mono font-semibold text-foreground">{solution.value.toFixed(3)}</span>
        </p>
      </div>
    </div>
);


export function SolutionPanel({ currentSolution, bestSolution, tabuList, step, onNext, onPrev, onReset }: SolutionPanelProps) {
  return (
    <Card className="h-full shadow-lg border-border flex flex-col bg-card">
      <CardHeader>
        <CardTitle className="text-3xl font-headline font-bold tracking-tight text-primary">Tabu Search</CardTitle>
        <CardDescription>f(x, y) = 3x² + y² | Iteration: <span className="font-semibold text-foreground">{step}</span></CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <div className="space-y-6 flex-grow">
            <SolutionInfo title="Best Solution Found" icon={<Trophy className="size-6 text-yellow-400" />} solution={bestSolution} />
            <Separator />
            <SolutionInfo title="Current Solution" icon={<Target className="size-6 text-primary" />} solution={currentSolution} />
            <Separator />
            <div className="flex items-start gap-4">
                <div className="mt-1 text-destructive"><List className="size-6" /></div>
                <div>
                    <h3 className="font-semibold text-lg text-card-foreground">Tabu List ({tabuList.length})</h3>
                    <ScrollArea className="h-32">
                      <div className="text-muted-foreground text-sm space-y-1 pr-4 font-mono">
                          {tabuList.length > 0 ? (
                              tabuList.map((p, i) => (
                                  <p key={i}>({p.x.toFixed(2)}, {p.y.toFixed(2)})</p>
                              )).reverse()
                          ) : (
                              <p className="font-sans italic">Empty</p>
                          )}
                      </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
        <div className="mt-auto pt-6 border-t border-border">
          <h4 className="font-semibold mb-3 text-card-foreground">Controls</h4>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrev} disabled={step <= 0} className="flex-1"><ChevronLeft /> Back</Button>
            <Button onClick={onNext} className="flex-1">Next <MoveRight /></Button>
          </div>
           <Button variant="ghost" size="sm" onClick={onReset} className="w-full mt-2 text-muted-foreground hover:text-foreground">
            <RefreshCcw className="mr-2 size-4"/>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
