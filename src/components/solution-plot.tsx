"use client";

import { ResponsiveContainer, ScatterChart, XAxis, YAxis, Tooltip, Scatter, ReferenceLine } from 'recharts';
import type { TabuState, Point, Solution } from '@/lib/tabu-search';

interface SolutionPlotProps {
  state: TabuState;
}

const CustomTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground p-3 border rounded-lg shadow-xl text-sm font-sans">
        <p className="font-bold text-base mb-1">{data.name}</p>
        <p className="font-mono">({data.x.toFixed(2)}, {data.y.toFixed(2)})</p>
        {data.value !== undefined && <p className="text-muted-foreground">f(x, y) = <span className="font-semibold text-foreground">{data.value.toFixed(3)}</span></p>}
      </div>
    );
  }
  return null;
};

const ContourBackground = () => {
  const contours: {level: number, points: {x: number, y: number}[]}[] = [];
  const step = 5;
  const maxContour = 100;

  for (let C = step; C <= maxContour * 2; C += step * 2) {
    const points: {x: number, y: number}[] = [];
    // 3x^2 + y^2 = C  => (x/sqrt(C/3))^2 + (y/sqrt(C))^2 = 1
    const a = Math.sqrt(C / 3);
    const b = Math.sqrt(C);

    if (a > 11 && b > 11) continue;

    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.1) {
      points.push({ x: a * Math.cos(angle), y: b * Math.sin(angle) });
    }
    contours.push({level: C, points});
  }

  return (
    <>
      {contours.map(contour => (
        <Scatter
          key={contour.level}
          data={contour.points}
          fill="transparent"
          line={{ stroke: "hsl(var(--border))", strokeWidth: 1.5, strokeDasharray: '3 3' }}
          shape={() => null}
          isAnimationActive={false}
          name={`Contour`}
          tooltipType="none"
        />
      ))}
    </>
  );
};


const isSamePoint = (p1: Point, p2: Point) => {
    return p1.x.toFixed(4) === p2.x.toFixed(4) && p1.y.toFixed(4) === p2.y.toFixed(4);
}

const distance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

const isCloseToTabu = (point: Point, tabuList: Point[]): boolean => {
    const TABU_PROXIMITY_THRESHOLD = 0.5;
    return tabuList.some(tabuPoint => distance(point, tabuPoint) < TABU_PROXIMITY_THRESHOLD);
}


export function SolutionPlot({ state }: SolutionPlotProps) {
  const { currentSolution, bestSolution, neighbors, tabuList, move } = state;

  const domain: [number, number] = [-11, 11];

  const toPlotData = (sol: Solution, name: string) => ({ ...sol.point, name, value: sol.value });
  const pointToPlotData = (p: Point, name: string) => ({...p, name});

  const isNeighborTabu = (neighbor: Solution, tabuList: Point[]) => {
    return tabuList.some(tabuPoint => isSamePoint(neighbor.point, tabuPoint)) || isCloseToTabu(neighbor.point, tabuList);
  };
  
  const eligibleNeighborData = neighbors
      .filter(n => !isNeighborTabu(n, tabuList) || n.value < bestSolution.value)
      .map(s => toPlotData(s, 'Neighbor'));

  const tabuNeighborData = neighbors
    .filter(n => isNeighborTabu(n, tabuList) && n.value >= bestSolution.value)
    .map(s => toPlotData(s, 'Tabu Neighbor'));

  // Filter out tabu points that overlap with the current solution for visual clarity
  const tabuData = tabuList
    .filter(p => !isSamePoint(p, currentSolution.point))
    .map(p => pointToPlotData(p, 'Tabu'));

  const currentData = [toPlotData(currentSolution, 'Current')];
  const bestData = [toPlotData(bestSolution, 'Best')];
  
  const moveData = move && move[0] && move[1] ? [{...move[0]}, {...move[1]}] : [];

  return (
    <div className="w-full h-full max-w-3xl aspect-square bg-card p-4 rounded-xl shadow-lg border">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" name="x" domain={domain} tick={false} axisLine={false} tickLine={false} />
          <YAxis type="number" dataKey="y" name="y" domain={domain} tick={false} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltipContent />} />
          
          <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={1} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />

          <ContourBackground />

          <Scatter name="Neighbors" data={eligibleNeighborData} fill="hsl(var(--muted-foreground))" shape="circle" />
          <Scatter name="Tabu Neighbors" data={tabuNeighborData} fill="hsl(var(--destructive) / 0.3)" shape="circle" />
          <Scatter name="Tabu" data={tabuData} fill="hsl(var(--destructive))" shape="cross" />
                    
          <Scatter name="Current" data={currentData} fill="hsl(var(--primary))" shape="diamond" />
          <Scatter name="Best" data={bestData} fill="#facc15" shape="wye" />
          
          {moveData.length > 0 && (
             <Scatter name="Move" data={moveData} fill="transparent" stroke="hsl(var(--accent) / 0.7)" strokeWidth={2} line={{ strokeWidth: 2 }} activeLine={false} shape={() => null} />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
