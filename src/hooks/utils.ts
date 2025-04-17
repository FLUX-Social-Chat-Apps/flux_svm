import { PublicKey } from "@solana/web3.js";
// import { BN, Program, web3 } from "@project-serum/anchor";

// function to format timestamp
export function formatTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString();
}

// function to format lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

// function to format SOL to lamports
export function solToLamports(sol: number): number {
  return sol * 1_000_000_000;
}

// function to find platform's PDA
export function findPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("platform")], programId);
}

// function to find user profile's PDA
export function findUserProfilePDA(
  userPublicKey: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), userPublicKey.toBuffer()],
    programId
  );
}

// function to find group's PDA
export function findGroupPDA(
  groupName: string,
  programId: PublicKey,
  adminPublicKey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("group"), adminPublicKey.toBuffer(), Buffer.from(groupName)],
    programId
  );
}

// function to find user  bet's PDA
export function findUserBetPDA(
  userPublicKey: PublicKey,
  betPDA: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_bet"), userPublicKey.toBuffer(), betPDA.toBuffer()],
    programId
  );
}

// function to calculate potential winnings in a bet
export function calculatePotentialWinnings(
  betAmount: number,
  odds: number,
  feePercentage: number
): number {
  return ((betAmount * odds) / 100) * (1 - feePercentage / 1000);
}

// function to determine if the current user is the admin of a group
export function isGroupAdmin(
  groupAdmin: PublicKey,
  userPublicKey: PublicKey
): boolean {
  return groupAdmin.toString() === userPublicKey.toString();
}

// function to determine if a betting period has ended
export function isBettingEnded(endTime: number): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= endTime;
}

// function to generate a unique bet Id
export function generateBetId(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `${sanitized}-${Math.floor(Date.now() / 1000)}`;
}

// function to get the programs's account data size for different account type (for estimating transaction cost)
export function getAccountSize(
  accountType: "platform" | "group" | "bet" | "userProfile" | "userBet"
): number {
  switch (accountType) {
    case "platform":
      return 200;
    case "group":
      return 300;
    case "bet":
      return 500;
    case "userProfile":
      return 400;
    case "userBet":
      return 150;
    default:
      return 0;
  }
}

// function to validate bet parameters before creating a bet
export function validateBetParams(
  options: string[],
  odds: number[]
): string | undefined {
  // Check that all options have a value
  if (options.some((opt) => opt.trim() === "")) {
    return "All options must have a value";
  }

  // Check that options and odds arrays have the same length
  if (options.length !== odds.length) {
    return "Options and odds must have the same number of entries";
  }

  // Check minimum number of options
  if (options.length < 2) {
    return "At least 2 options are required";
  }

  // Check maximum number of options
  if (options.length > 10) {
    return "Maximum 10 options allowed";
  }

  // Check that all odds are >= 100 (1x)
  if (odds.some((odd) => odd < 100)) {
    return "All odds must be at least 100 (1x)";
  }
  return undefined;
}
