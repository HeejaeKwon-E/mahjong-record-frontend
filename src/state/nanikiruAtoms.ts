// src/mahjong/state/nanikiruAtoms.ts
import { atom } from 'jotai';
import { selectedDateAtom } from './mahjongAtoms';
import rawData from '../data/nanikiru301.json'; // 경로는 실제 위치에 맞게 수정

// ===== 타입 정의 =====

export type NanikiruMeta = {
  source: string;
  total_problems: number;
  version: number;
};

export type NanikiruTile = {
  code: string;        // "5m", "동" ...
  label: string;       // "五", "東" ...
  color: string;       // "r", "b", ...
  meaning_ko: string;  // "5만", "동" ...
  type: 'number' | 'honor';
  suit?: 'man' | 'pin' | 'sou';
  rank?: number;
  aka?: boolean;
};

export type NanikiruEffectiveTile = {
  label: string;  // "5삭" 같은거
  count: number;  // 남은 장 수
};

export type NanikiruEffective = {
  raw: string;               // "1샨텐 [5삭: 19, ...]"
  shanten: number;
  tiles: NanikiruEffectiveTile[] | null;
};

export type NanikiruProblem = {
  id: number;
  round_text: string;       // "동1국 서가 8순"
  dora_indicator: string[]; // ["2p"]
  hand: string;             // "34567m2388p5779s"
  tsumo: string;            // "1p"
  calls: string[];          // 아직 안씀
  answers: string[];        // ["7삭"]
  explanations: string[];   // 설명 여러 줄
  effective: NanikiruEffective;
};

export type NanikiruRoot = {
  meta: NanikiruMeta;
  tiles: NanikiruTile[];
  problems: NanikiruProblem[];
};

// ===== JSON 로드 =====

const nanikiruData = rawData as NanikiruRoot;

export const nanikiruTilesAtom = atom<NanikiruTile[]>(nanikiruData.tiles);
export const nanikiruProblemsAtom = atom<NanikiruProblem[]>(nanikiruData.problems);

// ===== 오늘의 문제 atom =====
//
// serverTodayAtom: "YYYY-MM-DD" 형식 (이미 mahjongAtoms 에 있음)

export const todayNanikiruProblemAtom = atom((get) => {
  const today = get(selectedDateAtom);
  const problems = get(nanikiruProblemsAtom);
  console.log('todayNanikiruProblemAtom - today:', today, 'problems count:', problems);

  if (!today || problems.length === 0) return null;

  // YYYY-MM-DD → 숫자로 변환해서 seed 처럼 사용
  const seedNum = parseInt(today.replace(/-/g, ''), 10) || 1;

  const idx = seedNum % problems.length;
  return problems[idx];
});
