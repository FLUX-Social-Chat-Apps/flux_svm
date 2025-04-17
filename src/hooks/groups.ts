import { PublicKey } from "@solana/web3.js";
import { Program, web3 } from "@project-serum/anchor";
import { Group } from "./Types";

// function to create a group
export async function createGroup(
  program: Program,
  wallet: { publicKey: PublicKey },
  name: string,
  description: string
): Promise<PublicKey> {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  const [groupPDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("group"), wallet.publicKey.toBuffer(), Buffer.from(name)],
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
      .createGroup(name, description)
      .accountsStrict({
        group: groupPDA,
        admin: wallet.publicKey,
        platform: platformPDA,
        userProfile: userProfilePDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return groupPDA;
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
}

// function to join a group
export async function joinGroup(
  program: Program,
  wallet: { publicKey: PublicKey },
  groupId: string
) {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }
  const groupPDA = new PublicKey(groupId);
  const [userProfilePDA] = await PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
    program.programId
  );

  try {
    await program.methods
      .joinGroup()
      .accountsStrict({
        group: groupPDA,
        user: wallet.publicKey,
        userProfile: userProfilePDA,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return true;
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
}

//function to get a group details by id
export async function getGroupDetails(program: Program, groupId: string) {
  if (!program) {
    throw new Error("Program not initialized");
  }
  try {
    const groupPDA = new PublicKey(groupId);
    const groupAccount = await program.account.group.fetch(groupPDA);

    return {
      name: groupAccount.name,
      description: groupAccount.description,
      admin: groupAccount.admin,
      members: groupAccount.members,
      activeBets: groupAccount.activeBets,
      pastBets: groupAccount.pastBets,
      createdAt: groupAccount.createdAt.toNumber(),
    };
  } catch (error) {
    console.error("Error getting group details:", error);
    throw error;
  }
}

// function to get users in a group
export async function getUsersInGroup(
  program: Program,
  wallet: { publicKey: PublicKey }
) {
  if (!program || !wallet) {
    throw new Error("Program or wallet not initialized");
  }

  try {
    const [userProfilePDA] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), wallet.publicKey.toBuffer()],
      program.programId
    );

    const userProfileAccount = await program.account.userProfile.fetch(
      userProfilePDA
    );

    const groupPromises = userProfileAccount.groups.map((groupPDA: PublicKey) =>
      getGroupDetails(program, groupPDA.toString())
    );

    const groups = (await Promise.all(groupPromises)).filter(
      (group: Group | null) => group !== null
    ) as Group[];

    return groups;
  } catch (error) {
    console.error("Error getting users in group:", error);
    throw error;
  }
}
