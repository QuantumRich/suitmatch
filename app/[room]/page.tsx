"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import RoomBody from "@/components/RoomBody";
import { getUserId, getDisplayName } from "@/lib/util/storage";
import { normalizeCode } from "@/lib/util/roomCode";

export default function RoomPage() {
  const params = useParams();
  const code = normalizeCode(String(params.room));
  const [myUid] = useState(() => getUserId());
  const [initialName] = useState(() => getDisplayName());

  return <RoomBody code={code} myUid={myUid} initialName={initialName} />;
}
