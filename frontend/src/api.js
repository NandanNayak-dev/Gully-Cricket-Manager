const API_URL = "http://localhost:5000/api";

const getHeaders = (gullyId) => {
  const session = localStorage.getItem("gully-auth-session");
  const user = session ? JSON.parse(session) : null;
  return {
    "Content-Type": "application/json",
    "x-gully-id": gullyId,
    "Authorization": user && user.token ? `Bearer ${user.token}` : "",
  };
};

export const fetchMatchesApi = async (gullyId) => {
  const res = await fetch(`${API_URL}/matches`, { headers: getHeaders(gullyId) });
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
};

export const createTeamApi = async (gullyId, teamData) => {
  const res = await fetch(`${API_URL}/teams`, {
    method: "POST",
    headers: getHeaders(gullyId),
    body: JSON.stringify(teamData),
  });
  if (!res.ok) throw new Error("Failed to create team");
  return res.json();
};

export const startMatchApi = async (gullyId, matchData) => {
  const res = await fetch(`${API_URL}/matches/start`, {
    method: "POST",
    headers: getHeaders(gullyId),
    body: JSON.stringify(matchData),
  });
  if (!res.ok) throw new Error("Failed to start match");
  return res.json();
};

export const addBallApi = async (gullyId, matchId, ballData) => {
  const res = await fetch(`${API_URL}/matches/${matchId}/ball`, {
    method: "POST",
    headers: getHeaders(gullyId),
    body: JSON.stringify(ballData),
  });
  if (!res.ok) throw new Error("Failed to add ball");
  return res.json();
};

export const updateMatchApi = async (gullyId, matchId, updateData) => {
  const res = await fetch(`${API_URL}/matches/${matchId}`, {
    method: "PUT",
    headers: getHeaders(gullyId),
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error("Failed to update match");
  return res.json();
};

export const deleteMatchApi = async (gullyId, matchId) => {
  const res = await fetch(`${API_URL}/matches/${matchId}`, {
    method: "DELETE",
    headers: getHeaders(gullyId),
  });
  if (!res.ok) throw new Error("Failed to delete match");
  return res.json();
};
