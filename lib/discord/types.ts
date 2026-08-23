export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

export type ActivityIdentity = {
  uid: string;       // discord user id — stable across sessions
  name: string;      // display name shown in the lobby
  roomCode: string;  // derived from instanceId
};
