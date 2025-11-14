export type Point = { x: number; y: number };
export type Solution = { point: Point; value: number };

export type TabuState = {
  currentSolution: Solution;
  bestSolution: Solution;
  neighbors: Solution[];
  tabuList: Point[];
  move: [Point, Point] | null;
  previousSolution: Solution | null;
};

const NEIGHBOR_COUNT = 5;
const DOMAIN_MIN = -10;
const DOMAIN_MAX = 10;
const NEIGHBOR_STEP = 1.5;
const TABU_PROXIMITY_THRESHOLD = 0.5;
const SEED = 1234;

class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    random(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}

const prng = new SeededRandom(SEED);

export const objectiveFunction = (p: Point): number => {
  return 3 * p.x * p.x + p.y * p.y;
};

const randomInRange = (min: number, max: number) => prng.random() * (max - min) + min;

export const generateInitialState = (): TabuState => {
  prng.seed = SEED; // Reset seed for reproducibility on reset
  const startPoint = {
    x: randomInRange(DOMAIN_MIN, DOMAIN_MAX),
    y: randomInRange(DOMAIN_MIN, DOMAIN_MAX),
  };
  const startSolution = { point: startPoint, value: objectiveFunction(startPoint) };
  
  return {
    currentSolution: startSolution,
    bestSolution: startSolution,
    neighbors: [],
    tabuList: [],
    move: null,
    previousSolution: null,
  };
};

export const generateNeighbors = (currentPoint: Point): Solution[] => {
  const neighbors: Solution[] = [];
  const randomAngleOffset = prng.random() * 2 * Math.PI;

  for (let i = 0; i < NEIGHBOR_COUNT; i++) {
    const angle = (i / NEIGHBOR_COUNT) * 2 * Math.PI + randomAngleOffset;
    let newX = currentPoint.x + NEIGHBOR_STEP * Math.cos(angle);
    let newY = currentPoint.y + NEIGHBOR_STEP * Math.sin(angle);

    newX = Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, newX));
    newY = Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, newY));

    const newPoint = { x: newX, y: newY };
    neighbors.push({ point: newPoint, value: objectiveFunction(newPoint) });
  }
  return neighbors;
};

const isTabu = (point: Point, tabuList: Point[]): boolean => {
  return tabuList.some(tabuPoint => tabuPoint.x.toFixed(4) === point.x.toFixed(4) && tabuPoint.y.toFixed(4) === point.y.toFixed(4));
};

const distance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

const isCloseToTabu = (point: Point, tabuList: Point[]): boolean => {
  return tabuList.some(tabuPoint => distance(point, tabuPoint) < TABU_PROXIMITY_THRESHOLD);
}


export const performStep = (prevState: TabuState, tabuListSize: number): TabuState => {
  const { currentSolution, bestSolution, tabuList } = prevState;

  const neighbors = prevState.neighbors;
  
  const candidateNeighbors = neighbors.filter(neighbor => {
    const isNeighborTabu = isTabu(neighbor.point, tabuList) || isCloseToTabu(neighbor.point, tabuList);
    const meetsAspiration = neighbor.value < bestSolution.value;

    return !isNeighborTabu || meetsAspiration;
  });
  
  let bestNeighborOfCurrentStep: Solution;

  if (candidateNeighbors.length > 0) {
    candidateNeighbors.sort((a, b) => a.value - b.value);
    bestNeighborOfCurrentStep = candidateNeighbors[0];
  } else {
    // If all neighbors are tabu and none meet aspiration, relax condition and just take the best one.
    neighbors.sort((a, b) => a.value - b.value);
    bestNeighborOfCurrentStep = neighbors[0];
  }
  
  const newCurrentSolution = bestNeighborOfCurrentStep;
  const newBestSolution = newCurrentSolution.value < bestSolution.value ? newCurrentSolution : bestSolution;

  const newTabuList = [...tabuList];
  // Add the point we are moving FROM to the tabu list
  if (Object.keys(currentSolution.point).length > 0) {
    newTabuList.push(currentSolution.point);
  }
  
  while (newTabuList.length > tabuListSize) {
    newTabuList.shift();
  }

  const nextNeighbors = generateNeighbors(newCurrentSolution.point);

  return {
    previousSolution: currentSolution,
    currentSolution: newCurrentSolution,
    bestSolution: newBestSolution,
    neighbors: nextNeighbors,
    tabuList: newTabuList,
    move: [currentSolution.point, newCurrentSolution.point],
  };
};
