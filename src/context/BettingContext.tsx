"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider } from "@project-serum/anchor";

import {
  // Types
  BettingPool,
  UserBet,
  Group,
  UserProfile,

  // Group functions
  createGroup,
  joinGroup,
  getGroupDetails,
  getUsersInGroup,

  // Bet functions
  createBettingPool,
  getActiveBets,
  getBets,
  placeBet,
  autoResolveBet,
  resolveBet,
  claimWinnings,
  getBet,

  // User functions
  getUserProfile,
  getUserBet,
  getUserBets,

  // Utility functions
  formatTimestamp,
  lamportsToSol,
  solToLamports,
  calculatePotentialWinnings,
  isGroupAdmin,
  isBettingEnded,
  // generateBetId,
  // getAccountSize,
  validateBetParams,
} from "@/hooks/Types";

import idl from "./flux_betting.json";

// Ensure the IDL is properly parsed and matches the expected structure
if (!idl || !idl.accounts || !idl.instructions) {
  throw new Error("Invalid IDL file: Ensure it is properly structured.");
}

const PROGRAM_ID = new PublicKey(
  "6HaQcudkjjPCn3wP7iSV9HKwhLSN63kLinqVLPBVPoVb"
);
interface BettingContextType {
  program: Program | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  createGroup: (name: string, description: string) => Promise<PublicKey>;
  joinGroup: (groupId: string) => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<Group | null>;
  fetchUserGroups: () => Promise<Group[]>;

  createBettingPool: (params: {
    groupId: string;
    betId: string;
    coin: string;
    description: string;
    options: string[];
    odds: number[];
    endTime: number;
    minBetAmount: number;
  }) => Promise<PublicKey>;
  getActiveBets: (groupId: string) => Promise<BettingPool[]>;
  getBets: (groupId: string) => Promise<BettingPool[]>;
  placeBet: (
    betId: string,
    optionIndex: number,
    amount: number
  ) => Promise<void>;
  autoResolveBet: (betId: string) => Promise<void>;
  resolveBet: (
    betId: string,
    winningOption: number,
    actualPrice: number
  ) => Promise<void>;
  claimWinnings: (betId: string) => Promise<void>;
  getBet: (betId: string) => Promise<BettingPool | null>;

  // User functions
  getUserProfile: () => Promise<UserProfile | null>;
  getUserBet: (betId: string) => Promise<UserBet | null>;
  getUserBets: () => Promise<UserBet[]>;

  // Utility functions
  formatTimestamp: (timestamp: number) => string;
  lamportsToSol: (lamports: number) => number;
  solToLamports: (sol: number) => number;
  calculatePotentialWinnings: (
    betAmount: number,
    odds: number,
    feePercentage: number
  ) => number;
  isGroupAdmin: (groupAdmin: PublicKey, userPublicKey: PublicKey) => boolean;
  isBettingPeriodEnded: (endTime: number) => boolean;
  formatPublicKey: (
    publicKey: PublicKey | string,
    prefixLength?: number,
    suffixLength?: number
  ) => string;
  validateBetParams: (options: string[], odds: number[]) => string | undefined;
}

const defaultContext: BettingContextType = {
  program: null,
  isInitialized: false,
  isLoading: false,
  error: null,

  createGroup: async () => {
    throw new Error("Not initialized");
  },
  joinGroup: async () => {
    throw new Error("Not initialized");
  },
  fetchGroupDetails: async () => {
    throw new Error("Not initialized");
  },
  fetchUserGroups: async () => {
    throw new Error("Not initialized");
  },

  createBettingPool: async () => {
    throw new Error("Not initialized");
  },
  getActiveBets: async () => {
    throw new Error("Not initialized");
  },
  getBets: async () => {
    throw new Error("Not initialized");
  },
  placeBet: async () => {
    throw new Error("Not initialized");
  },
  autoResolveBet: async () => {
    throw new Error("Not initialized");
  },
  resolveBet: async () => {
    throw new Error("Not initialized");
  },
  claimWinnings: async () => {
    throw new Error("Not initialized");
  },
  getBet: async () => {
    throw new Error("Not initialized");
  },

  getUserProfile: async () => {
    throw new Error("Not initialized");
  },
  getUserBet: async () => {
    throw new Error("Not initialized");
  },
  getUserBets: async () => {
    throw new Error("Not initialized");
  },

  formatTimestamp: () => "",
  lamportsToSol: () => 0,
  solToLamports: () => 0,
  calculatePotentialWinnings: () => 0,
  isGroupAdmin: () => false,
  isBettingPeriodEnded: () => false,
  formatPublicKey: () => "",
  validateBetParams: () => undefined,
};

const BettingContext = createContext<BettingContextType>(defaultContext);

export const BettingProvider = ({ children }: { children: ReactNode }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [program, setProgram] = useState<Program | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      try {
        const provider = new AnchorProvider(connection, wallet, {
          preflightCommitment: "processed",
        });

        // @ts-expect-error - type issues with the idl import
        const program = new Program(idl, PROGRAM_ID, provider);
        setProgram(program);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error("Failed to initialize Flux Betting program:", err);
        setError("Failed to initialize program");
        setIsInitialized(false);
      }
    } else {
      setProgram(null);
      setIsInitialized(false);
      setError(null);
    }
  }, [connection, wallet]);

  const createGroupWrapper = useCallback(
    async (name: string, description: string): Promise<PublicKey> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        return await createGroup(program, wallet, name, description);
      } catch (err: unknown) {
        console.error("Error creating group:", err);
        setError(
          `Failed to create group: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const joinGroupWrapper = useCallback(
    async (groupId: string): Promise<void> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        await joinGroup(program, wallet, groupId);
      } catch (err: unknown) {
        console.error("Error joining group:", err);
        setError(
          `Failed to join group: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const fetchGroupDetailsWrapper = useCallback(
    async (groupId: string): Promise<Group | null> => {
      if (!program) throw new Error("Program not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const groupDetails = await getGroupDetails(program, groupId);
        if (groupDetails) {
          return {
            id: groupId,
            ...groupDetails,
          };
        }
        return null;
      } catch (err: unknown) {
        console.error("Error fetching group details:", err);
        setError(
          `Failed to fetch group details: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [program]
  );

  const fetchUserGroupsWrapper = useCallback(async (): Promise<Group[]> => {
    if (!program || !wallet) throw new Error("Wallet not connected");

    setIsLoading(true);
    setError(null);

    try {
      return await getUsersInGroup(program, wallet);
    } catch (err: unknown) {
      console.error("Error fetching user groups:", err);
      setError(
        `Failed to fetch user groups: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [program, wallet]);

  const createBettingPoolWrapper = useCallback(
    async (params: {
      groupId: string;
      betId: string;
      coin: string;
      description: string;
      options: string[];
      odds: number[];
      endTime: number;
      minBetAmount: number;
    }): Promise<PublicKey> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        return await createBettingPool(program, wallet, params);
      } catch (err: unknown) {
        console.error("Error creating betting pool:", err);
        setError(
          `Failed to create betting pool: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const getActiveBetsWrapper = useCallback(
    async (groupId: string): Promise<BettingPool[]> => {
      if (!program) throw new Error("Program not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await getActiveBets(program, groupId);
      } catch (err: unknown) {
        console.error("Error fetching betting pools:", err);
        setError(
          `Failed to fetch betting pools: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [program]
  );

  const getBetsWrapper = useCallback(
    async (groupId: string): Promise<BettingPool[]> => {
      if (!program) throw new Error("Program not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await getBets(program, groupId);
      } catch (err: unknown) {
        console.error("Error fetching bets:", err);
        setError(
          `Failed to fetch bets: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [program]
  );

  const placeBetWrapper = useCallback(
    async (
      betId: string,
      optionIndex: number,
      amount: number
    ): Promise<void> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        await placeBet(program, wallet, betId, optionIndex, amount);
      } catch (err: unknown) {
        console.error("Error placing bet:", err);
        setError(
          `Failed to place bet: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const autoResolveBetWrapper = useCallback(
    async (betId: string): Promise<void> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        await autoResolveBet(program, wallet, betId);
      } catch (err: unknown) {
        console.error("Error auto-resolving bet:", err);
        setError(
          `Failed to auto-resolve bet: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const resolveBetWrapper = useCallback(
    async (
      betId: string,
      winningOption: number,
      actualPrice: number
    ): Promise<void> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        await resolveBet(program, wallet, betId, winningOption, actualPrice);
      } catch (err: unknown) {
        console.error("Error resolving bet:", err);
        setError(
          `Failed to resolve bet: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const claimWinningsWrapper = useCallback(
    async (betId: string): Promise<void> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        await claimWinnings(program, wallet, betId);
      } catch (err: unknown) {
        console.error("Error claiming winnings:", err);
        setError(
          `Failed to claim winnings: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const getBetWrapper = useCallback(
    async (betId: string): Promise<BettingPool | null> => {
      if (!program) throw new Error("Program not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await getBet(program, betId);
      } catch (err: unknown) {
        console.error("Error fetching bet:", err);
        setError(
          `Failed to fetch bet: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [program]
  );

  // User functions wrapped with loading and error handling
  const getUserProfileWrapper =
    useCallback(async (): Promise<UserProfile | null> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        return await getUserProfile(program, wallet);
      } catch (err: unknown) {
        console.error("Error fetching user profile:", err);
        setError(
          `Failed to fetch user profile: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [program, wallet]);

  const getUserBetWrapper = useCallback(
    async (betId: string): Promise<UserBet | null> => {
      if (!program || !wallet) throw new Error("Wallet not connected");

      setIsLoading(true);
      setError(null);

      try {
        return await getUserBet(program, wallet, betId);
      } catch (err: unknown) {
        console.error("Error fetching user bet:", err);
        setError(
          `Failed to fetch user bet: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [program, wallet]
  );

  const getUserBetsWrapper = useCallback(async (): Promise<UserBet[]> => {
    if (!program || !wallet) throw new Error("Wallet not connected");

    setIsLoading(true);
    setError(null);

    try {
      return await getUserBets(program, wallet);
    } catch (err: unknown) {
      console.error("Error fetching user bets:", err);
      setError(
        `Failed to fetch user bets: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [program, wallet]);

  // Utility functions - direct pass-through since they don't need error handling or loading state
  const calculatePotentialWinningsWrapper = useCallback(
    (betAmount: number, odds: number, feePercentage: number): number => {
      return calculatePotentialWinnings(betAmount, odds, feePercentage);
    },
    []
  );

  const isGroupAdminWrapper = useCallback(
    (groupAdmin: PublicKey, userPublicKey: PublicKey): boolean => {
      return isGroupAdmin(groupAdmin, userPublicKey);
    },
    []
  );

  const isBettingPeriodEndedWrapper = useCallback(
    (endTime: number): boolean => {
      return isBettingEnded(endTime);
    },
    []
  );

  const formatPublicKeyWrapper = useCallback(
    (
      publicKey: PublicKey | string,
      prefixLength = 4,
      suffixLength = 4
    ): string => {
      const pubKeyStr =
        typeof publicKey === "string" ? publicKey : publicKey.toString();
      if (pubKeyStr.length <= prefixLength + suffixLength) return pubKeyStr;
      return `${pubKeyStr.slice(0, prefixLength)}...${pubKeyStr.slice(
        -suffixLength
      )}`;
    },
    []
  );

  const validateBetParamsWrapper = useCallback(
    (options: string[], odds: number[]): string | undefined => {
      return validateBetParams(options, odds);
    },
    []
  );

  // Provide context value
  const contextValue: BettingContextType = {
    program,
    isInitialized,
    isLoading,
    error,

    // Group functions
    createGroup: createGroupWrapper,
    joinGroup: joinGroupWrapper,
    fetchGroupDetails: fetchGroupDetailsWrapper,
    fetchUserGroups: fetchUserGroupsWrapper,

    // Betting functions
    createBettingPool: createBettingPoolWrapper,
    getActiveBets: getActiveBetsWrapper,
    getBets: getBetsWrapper,
    placeBet: placeBetWrapper,
    autoResolveBet: autoResolveBetWrapper,
    resolveBet: resolveBetWrapper,
    claimWinnings: claimWinningsWrapper,
    getBet: getBetWrapper,

    // User functions
    getUserProfile: getUserProfileWrapper,
    getUserBet: getUserBetWrapper,
    getUserBets: getUserBetsWrapper,

    // Utility functions
    formatTimestamp,
    lamportsToSol,
    solToLamports,
    calculatePotentialWinnings: calculatePotentialWinningsWrapper,
    isGroupAdmin: isGroupAdminWrapper,
    isBettingPeriodEnded: isBettingPeriodEndedWrapper,
    formatPublicKey: formatPublicKeyWrapper,
    validateBetParams: validateBetParamsWrapper,
  };

  return (
    <BettingContext.Provider value={contextValue}>
      {children}
    </BettingContext.Provider>
  );
};

// Custom hook to use the betting context
export const useBetting = () => useContext(BettingContext);
