"use client";

import { useState } from "react";
import { useBetting } from "../context/BettingContext";
import { BettingPool, UserProfile } from "../hooks/Types";

export default function BettingExample() {
  const {
    isInitialized,
    isLoading,
    error,
    createGroup,
    getActiveBets,
    getUserProfile,
  } = useBetting();

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupId, setGroupId] = useState("");
  const [activeBets, setActiveBets] = useState<BettingPool[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleCreateGroup = async () => {
    try {
      const groupPda = await createGroup(groupName, groupDesc);
      setGroupId(groupPda.toString());
      alert(`Group created with ID: ${groupPda.toString()}`);
    } catch (err: unknown) {
      console.error("Failed to create group:", err);
      alert(
        `Error creating group: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleGetBets = async () => {
    if (!groupId) {
      alert("Please enter a group ID");
      return;
    }

    try {
      const bets = await getActiveBets(groupId);
      setActiveBets(bets);
    } catch (err: unknown) {
      console.error("Failed to get active bets:", err);
      alert(
        `Error getting bets: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleGetProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (err: unknown) {
      console.error("Failed to get user profile:", err);
      alert(
        `Error getting profile: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-4">
        Please connect your wallet to use this application.
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Betting Platform Example</h1>

      {error && (
        <div className="bg-red-100 p-3 mb-4 rounded text-red-700">{error}</div>
      )}

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl mb-2">Create a Group</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Group Description"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={handleCreateGroup}
            disabled={isLoading || !groupName}
            className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
          >
            {isLoading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl mb-2">Get Active Bets</h2>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Group ID"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={handleGetBets}
            disabled={isLoading}
            className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
          >
            {isLoading ? "Loading..." : "Get Bets"}
          </button>
        </div>

        {activeBets.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold">Active Bets:</h3>
            <ul className="list-disc pl-5">
              {activeBets.map((bet) => (
                <li key={bet.id} className="mt-2">
                  <div>
                    <strong>ID:</strong> {bet.id}
                  </div>
                  <div>
                    <strong>Description:</strong> {bet.description}
                  </div>
                  <div>
                    <strong>Coin:</strong> {bet.coin}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl mb-2">Get User Profile</h2>
        <button
          onClick={handleGetProfile}
          disabled={isLoading}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
        >
          {isLoading ? "Loading..." : "Get Profile"}
        </button>

        {userProfile && (
          <div className="mt-4">
            <h3 className="font-bold">User Profile:</h3>
            <div>
              <strong>ID:</strong> {userProfile.id}
            </div>
            <div>
              <strong>Total Winnings:</strong> {userProfile.totalWinnings}
            </div>
            <div>
              <strong>Total Losses:</strong> {userProfile.totalLosses}
            </div>
            <div>
              <strong>Groups:</strong> {userProfile.groups.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
