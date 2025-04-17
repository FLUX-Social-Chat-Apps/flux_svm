import { PublicKey } from "@solana/web3.js";

export * from "./bets";
export * from "./groups";
export * from "./users";
export * from "./utils";

export interface BettingPool {
  id: string;
  group: string;
  creator: string;
  coin: string;
  description: string;
  options: string[];
  odds: number[];
  minBetAmount: number;
  totalPool: number;
  betsPerOption: number[];
  createdAt: number;
  endTime: number;
  resolved: boolean;
  winningOption: number | null;
  actualPrice: number | null;
}

export interface UserBet {
  id: string;
  bet: string;
  amount: number;
  optionIndex: number;
  claimed: boolean;
  winnings: number | null;
}

export interface UserProfile {
  id: string;
  user: PublicKey;
  groups: PublicKey[];
  activeBets: PublicKey[];
  pastBets: PublicKey[];
  totalWinnings: number;
  totalLosses: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  admin: PublicKey;
  members: PublicKey[];
  activeBets: PublicKey[];
  pastBets: PublicKey[];
  createdAt: number;
}
