 "use server";

import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { ACTION, ENTITY_TYPE } from "@prisma/client";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/create-audit-log";
import { createSafeAction } from "@/lib/create-safe-action";

import { MoveCard } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = auth();

  if (!userId || !orgId) {
    return {
      error: "Unauthorized",
    };
  }

  const { id, boardId } = data;
  let list;

  try {
    // Fetch the list to be moved
    const listToMove = await db.list.findUnique({
      where: {
        id,
        boardId,
        board: {
          orgId,
        },
      },
    });

    if (!listToMove) {
      return { error: "List not found" };
    }

    // Implement move logic here, update the list's boardId or any other necessary changes
    // For example, you can prompt the user to select the new board or list for moving

    // Update list's boardId (this is just a placeholder, replace with your actual move logic)
    list = await db.list.update({
      where: {
        id,
      },
      data: {
        boardId: "newBoardId", // Change to the new board's ID
      },
    });

    await createAuditLog({
      entityTitle: list.title,
      entityId: list.id,
      entityType: ENTITY_TYPE.LIST,
      action: ACTION.MOVE, // Custom action type for moving lists
    });
    
  } catch (error) {
    return {
      error: "Failed to move.",
    };
  }

  // Revalidate path to update cache
  revalidatePath(`/board/${boardId}`);
  return { data: list };
};

export const moveCard = createSafeAction(MoveCard, handler);

