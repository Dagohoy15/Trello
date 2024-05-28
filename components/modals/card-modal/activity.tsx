"use client";

import { useEffect, useState } from "react";
import { AuditLog } from "@prisma/client";
import { ActivityIcon, Link } from "lucide-react";
import axios from "axios"; // Import axios for making HTTP requests
import { EditorState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { fetcher } from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityItem } from "@/components/activity-item";
import { db } from "@/lib/db";

// Define the Attachment interface
interface Attachment {
  id: number;
  url: string;
  displayText?: string | null;
}

interface ActivityProps {
  items: AuditLog[];
}

interface Comment {
  id: number;
  text: string;
}

const api = axios.create({
  baseURL: "/api",
});

export const Activity = ({ items }: ActivityProps) => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCommentFocused, setIsCommentFocused] = useState(false); // State to track comment focus

  const fetchComments = async () => {
    await fetcher("/api/comments")
      .then((res) => {
        setComments(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchAttachments = async () => {
    try {
      const response = await api.get("/attachments");
      setAttachments(response.data);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const handleSaveComment = async () => {
    try {
      const contentState = editorState.getCurrentContent();
      const rawContentState = convertToRaw(contentState);
      const commentText = JSON.stringify(rawContentState);

      const commentData = {
        text: commentText,
        userId: "user_id_here", // Replace 'user_id_here' with the actual user ID
        entityId: "entity_id_here", // Replace 'entity_id_here' with the actual entity ID
        entityType: "CARD", // Assuming you're adding comments to cards
      };

      const response = await api.post("/comments", { comment: commentData });

      setEditorState(EditorState.createEmpty());
      fetchComments();
    } catch (error) {
      console.error("Error saving comment:", error);
    }
  };

  const isEditorEmpty = () => {
    const contentState = editorState.getCurrentContent();
    const contentStateText = contentState.getPlainText().trim();
    return contentStateText === "";
  };

  useEffect(() => {
    // Fetch comments and attachments when the component mounts
    fetchComments();
    fetchAttachments();
  }, []);

  return (
    <div className="flex flex-col items-start gap-y-3 w-full">
      <div className="flex items-center gap-x-3 w-full">
        <ActivityIcon className="h-5 w-5 mt-0.5 text-neutral-700" />
        <div className="w-full">
          <p className="font-semibold text-neutral-700 mb-2">Activity</p>
          <ol className="mt-2 space-y-4">
            {items.map((item) => (
              <ActivityItem key={item.id} data={item} />
            ))}
          </ol>
        </div>
      </div>
      <div className="w-full">
        <Editor
          editorState={editorState}
          wrapperClassName="border border-gray-300 rounded-md px-3 py-2"
          editorClassName="px-3 py-2"
          toolbarClassName="bg-white border-t border-gray-300"
          onEditorStateChange={setEditorState}
          placeholder="Write a comment..."
          onFocus={() => setIsCommentFocused(true)} // Set focus state to true when comment editor is focused
          onBlur={() => setIsCommentFocused(false)} // Set focus state to false when comment editor is blurred
        />
        {isCommentFocused && ( // Render the Save button only when the comment editor is focused
          <button
            onClick={handleSaveComment}
            disabled={isEditorEmpty()}
            className={`px-4 py-2 rounded-md mt-2 ${
              !isEditorEmpty() ? "" : "opacity-50 cursor-not-allowed"
            } bg-blue-500 text-white`}
          >
            Save
          </button>
        )}
      </div>
      <div className="w-full">
        <ul className="mt-2 space-y-2">
          {comments.map((comment) => (
            <li key={comment.id}>{comment.text}</li>
          ))}
        </ul>
      </div>
      <div className="w-full">
        <ul className="mt-2 space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                <Link size={16} className="mr-1" />
                {attachment.displayText || attachment.url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

Activity.Skeleton = function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-x-3 w-full">
      <Skeleton className="h-6 w-6 bg-neutral-200" />
      <div className="w-full">
        <Skeleton className="w-24 h-6 mb-2 bg-neutral-200" />
        <Skeleton className="w-full h-10 bg-neutral-200" />
      </div>
    </div>
  );
};
