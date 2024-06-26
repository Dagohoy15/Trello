"use server";

import { auth} from "@clerk/nextjs";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DeleteList } from "./schema";
import { createSafeAction } from "@/lib/create-safe-action";



const handler = async (data: InputType): Promise<ReturnType> => {
    const {userId, orgId} = auth();
    

if (!userId || !orgId) {
    return{
        error: "Unauthorized",
    };
}
const { id, boardId } = data;

    let list;

    try {
        list= await db.list.delete({
            where: {
                id,
                boardId,
                board: {
                    orgId,
                },
            },
    
        });
    } catch (error) {
        return {
            error: "Failed to delete."
        }  
    }
    
    revalidatePath(`/board/${boardId}`);
    return { data: list };


};
export const deletelist= createSafeAction(DeleteList, handler);