import { PublicKey } from "@solana/web3.js";
import { Program, web3, BN } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BettingPool } from "./Types";

// function to create a new betting pool
export async function createBettingPool(
  program: Program,
  wallet: { publicKey: PublicKey },
  params: {
    groupId: string;
    betId: string;
    coin: string;
    description: string;
    options: string[];
    odds: number[];
    endTime: number;
    minBetAmount: number;
  }
): Promise<PublicKey> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  const groupPDA = new PublicKey(params.groupId);

  const [betPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), groupPDA.toBuffer(), Buffer.from(params.betId)],
    program.programId
  );

  const [userProfilePDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [platformPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    program.programId
  );

  try {
    await program.methods
      .createBet(
        params.betId,
        params.coin,
        params.description,
        params.options,
        params.odds,
        new BN(params.endTime),
        new BN(params.minBetAmount)
      )
      .accountsStrict({
        bet: betPDA,
        group: groupPDA,
        creator: wallet.publicKey,
        platform: platformPDA,
        userProfile: userProfilePDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return betPDA;
  } catch (error) {
    console.error("Error creating betting pool:", error);
    throw error;
  }
}

// function to get all active bets in a groups
export async function getActiveBets(
  program: Program,
  groupId: string
): Promise<BettingPool[]> {
  if (!program) {
    throw new Error("Program not initialized");
  }

  try {
    const groupPDA = new PublicKey(groupId);
    const groupAccount = await program.account.group.fetch(groupPDA);

    const betPromises = groupAccount.activeBets.map(
      async (betPDA: PublicKey) => {
        const betAccount = await program.account.bet.fetch(betPDA);

        return {
          id: betPDA.toString(),
          group: betAccount.group,
          creator: betAccount.creator,
          coin: betAccount.coin,
          description: betAccount.description,
          options: betAccount.options,
          odds: betAccount.odds,
          minBetAmount: betAccount.minBetAmount.toNumber(),
          totalPool: betAccount.totalPool.toNumber(),
          betsPerOption: betAccount.betsPerOption.map((b: BN) => b.toNumber()),
          createdAt: betAccount.createdAt.toNumber(),
          endTime: betAccount.endTime.toNumber(),
          resolved: betAccount.resolved,
          winningOption: betAccount.winningOption,
          actualPrice: betAccount.actualPrice
            ? betAccount.actualPrice.toNumber()
            : null,
        };
      }
    );

    const bets = await Promise.all(betPromises);
    return bets;
  } catch (error) {
    console.error("Error fetching betting pools:", error);
    return [];
  }
}

// function to get all bets in a group
export async function getBets(
  program: Program,
  groupId: string
): Promise<BettingPool[]> {
  if (!program) {
    throw new Error("Program not initialized");
  }

  try {
    const groupPDA = new PublicKey(groupId);
    const groupAccount = await program.account.group.fetch(groupPDA);

    const allBetPDAs = [...groupAccount.activeBets, ...groupAccount.pastBets];

    const betPromises = allBetPDAs.map(async (betPDA) => {
      const betAccount = await program.account.bet.fetch(betPDA);

      return {
        id: betPDA.toString(),
        group: betAccount.group,
        creator: betAccount.creator,
        coin: betAccount.coin,
        description: betAccount.description,
        options: betAccount.options,
        odds: betAccount.odds,
        minBetAmount: betAccount.minBetAmount.toNumber(),
        totalPool: betAccount.totalPool.toNumber(),
        betsPerOption: betAccount.betsPerOption.map((b: BN) => b.toNumber()),
        createdAt: betAccount.createdAt.toNumber(),
        endTime: betAccount.endTime.toNumber(),
        resolved: betAccount.resolved,
        winningOption: betAccount.winningOption,
        actualPrice: betAccount.actualPrice
          ? betAccount.actualPrice.toNumber()
          : null,
      };
    });

    const bets = await Promise.all(betPromises);
    return bets;
  } catch (error) {
    console.error("Error fetching bets:", error);
    return [];
  }
}

// function to place a bet

export async function placeBet(
  program: Program,
  wallet: { publicKey: PublicKey },
  betId: string,
  optionIndex: number,
  amount: number
): Promise<void> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  const betPDA = new PublicKey(betId);
  const betAccount = await program.account.bet.fetch(betPDA);
  const groupPDA = betAccount.group;

  const [userBetPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user_bet"), betPDA.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [userProfilePDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [platformPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    program.programId
  );

  const platformAccount = await program.account.platform.fetch(platformPDA);

  // For a production app, you would need to properly handle token accounts
  // This is just a placeholder - you'll need to replace with actual token accounts
  const lamports = amount * 1_000_000_000; // Convert SOL to lamports

  // In a real app, you'd use the correct token accounts
  const userTokenAccount = wallet.publicKey; // Placeholder
  const treasuryTokenAccount = platformAccount.treasury; // Placeholder

  try {
    // Call the program to place a bet
    await program.methods
      .placeBet(new BN(lamports), optionIndex)
      .accountsStrict({
        bet: betPDA,
        group: groupPDA,
        user: wallet.publicKey,
        userBet: userBetPDA,
        userProfile: userProfilePDA,
        platform: platformPDA,
        userTokenAccount,
        treasuryTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  } catch (error) {
    console.error("Error placing bet:", error);
    throw error;
  }
}

// function to auto-resolve a bet (when the time of the bet ends)
export async function autoResolveBet(
  program: Program,
  wallet: { publicKey: PublicKey },
  betId: string
): Promise<void> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  const betPDA = new PublicKey(betId);
  const betAccount = await program.account.bet.fetch(betPDA);
  const groupPDA = betAccount.group;

  try {
    await program.methods
      .autoResolveBet()
      .accountsStrict({
        bet: betPDA,
        group: groupPDA,
        payer: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  } catch (error) {
    console.error("Error auto-resolving bet:", error);
    throw error;
  }
}

// function to manually resolve a bet (done by the admin only)
export async function resolveBet(
  program: Program,
  wallet: { publicKey: PublicKey },
  betId: string,
  winningOption: number,
  actualPrice: number = 0
): Promise<void> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  const betPDA = new PublicKey(betId);
  const betAccount = await program.account.bet.fetch(betPDA);
  const groupPDA = betAccount.group;

  try {
    await program.methods
      .resolveBet(winningOption, new BN(actualPrice))
      .accountsStrict({
        bet: betPDA,
        creator: wallet.publicKey,
        group: groupPDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  } catch (error) {
    console.error("Error resolving bet:", error);
    throw error;
  }
}

// function to claim winnings from a resolved bet, done by the user
export async function claimWinnings(
  program: Program,
  wallet: { publicKey: PublicKey },
  betId: string
): Promise<void> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  const betPDA = new PublicKey(betId);

  const [userBetPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user_bet"), betPDA.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [userProfilePDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
    program.programId
  );

  const [platformPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("platform")],
    program.programId
  );

  const platformAccount = await program.account.platform.fetch(platformPDA);

  // For a production app, you would need to properly handle token accounts
  // This is just a placeholder - you'll need to replace with actual token accounts
  const userTokenAccount = wallet.publicKey; // Placeholder
  const treasuryTokenAccount = platformAccount.treasury; // Placeholder

  try {
    await program.methods
      .claimWinnings()
      .accountsStrict({
        bet: betPDA,
        userBet: userBetPDA,
        user: wallet.publicKey,
        userProfile: userProfilePDA,
        platform: platformPDA,
        treasuryTokenAccount,
        userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
  } catch (error) {
    console.error("Error claiming winnings:", error);
    throw error;
  }
}

// function to fetch a single bet by id
export async function getBet(
  program: Program,
  betId: string
): Promise<BettingPool | null> {
  if (!program) {
    throw new Error("Program not initialized");
  }

  try {
    const betPDA = new PublicKey(betId);
    const betAccount = await program.account.bet.fetch(betPDA);

    return {
      id: betPDA.toString(),
      group: betAccount.group,
      creator: betAccount.creator,
      coin: betAccount.coin,
      description: betAccount.description,
      options: betAccount.options,
      odds: betAccount.odds,
      minBetAmount: betAccount.minBetAmount.toNumber(),
      totalPool: betAccount.totalPool.toNumber(),
      betsPerOption: betAccount.betsPerOption.map((b: BN) => b.toNumber()),
      createdAt: betAccount.createdAt.toNumber(),
      endTime: betAccount.endTime.toNumber(),
      resolved: betAccount.resolved,
      winningOption: betAccount.winningOption,
      actualPrice: betAccount.actualPrice
        ? betAccount.actualPrice.toNumber()
        : null,
    };
  } catch (error) {
    console.error("Error fetching bet:", error);
    return null;
  }
}
