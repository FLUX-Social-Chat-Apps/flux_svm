import { PublicKey } from "@solana/web3.js";
import { Program } from "@project-serum/anchor";
import { UserProfile, UserBet } from "./Types";
import { getBet } from "./bets";

// function to get user profile
export async function getUserProfile(
  program: Program,
  wallet: { publicKey: PublicKey }
): Promise<UserProfile | null> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  try {
    const [userProfilePDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
      program.programId
    );
    try {
      const userProfile = await program.account.userProfile.fetch(
        userProfilePDA
      );
      return {
        id: userProfilePDA.toString(),
        user: userProfile.user,
        groups: userProfile.groups,
        activeBets: userProfile.activeBets,
        pastBets: userProfile.pastBets,
        totalWinnings: userProfile.totalWinnings.toNumber(),
        totalLosses: userProfile.totalLosses.toNumber(),
      };
    } catch (error) {
      console.log("User profile not found:", error);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

// function to get user bet
export async function getUserBet(
  program: Program,
  wallet: { publicKey: PublicKey },
  betId: string
): Promise<UserBet | null> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  try {
    const betPDA = new PublicKey(betId);

    const [userBetPDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user_bet"), betPDA.toBuffer(), wallet.publicKey.toBuffer()],
      program.programId
    );

    try {
      const userBet = await program.account.userBet.fetch(userBetPDA);
      const bet = await getBet(program, betId);

      if (!bet) {
        throw new Error("Bet not found");
      }

      return {
        id: userBetPDA.toString(),
        bet: betId,
        amount: userBet.amount.toNumber(),
        optionIndex: userBet.optionIndex,
        claimed: userBet.claimed,
        winnings: userBet.winnings ? userBet.winnings.toNumber() : null,
      };
    } catch (error) {
      console.log("User bet not found:", error);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user bet:", error);
    return null;
  }
}

// function to get all user bets
export async function getUserBets(
  program: Program,
  wallet: { publicKey: PublicKey }
): Promise<UserBet[]> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  try {
    const [userProfilePDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const userProfile = await program.account.userProfile.fetch(userProfilePDA);

    const allBetIds = [...userProfile.activeBets, ...userProfile.pastBets].map(
      (betPDA) => betPDA.toString()
    );
    const uniqueBetIds = [...new Set(allBetIds)];
    const userBetPromises = uniqueBetIds.map((betId) =>
      getUserBet(program, wallet, betId)
    );

    const userBets = (await Promise.all(userBetPromises)).filter(
      (userBet) => userBet !== null
    ) as UserBet[];
    return userBets;
  } catch (error) {
    console.error("Error fetching user bets:", error);
    return [];
  }
}
