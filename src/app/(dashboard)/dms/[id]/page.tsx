"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import {
  EditIcon,
  LoaderIcon,
  MoreVerticalIcon,
  PlusIcon,
  SendIcon,
  SmileIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👀"];

export default function MessagePage({
  params,
}: {
  params: Promise<{ id: Id<"directMessages"> }>;
}) {
  const { id } = use(params);

  const directMessage = useQuery(api.functions.dm.get, { id });
  const {
    results: messages,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.functions.message.list,
    { directMessage: id },
    { initialNumItems: 50 }
  );

  if (!directMessage) return null;

  return (
    <div className="flex flex-1 flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
        <div className="relative">
          <Avatar className="size-9 border border-border/50 shadow-sm">
            <AvatarImage src={directMessage.user.image} />
            <AvatarFallback className="text-sm font-semibold">
              {directMessage.user.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <OnlineStatusDot userId={directMessage.user._id} />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">
            {directMessage.user.username}
          </h1>
          <OnlineStatusText userId={directMessage.user._id} />
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 py-2">
        <div className="flex flex-col gap-0.5 pb-2">
          {status === "CanLoadMore" && (
            <div className="flex justify-center py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMore(50)}
                className="text-xs"
              >
                Load earlier messages
              </Button>
            </div>
          )}
          {status === "LoadingMore" && (
            <div className="flex justify-center py-3">
              <LoaderIcon className="animate-spin size-4 text-muted-foreground" />
            </div>
          )}

          {messages
            ?.slice()
            .reverse()
            .map((message, idx, arr) => {
              const prevMessage = arr[idx - 1];
              const isGrouped =
                prevMessage &&
                prevMessage.sender?._id === message.sender?._id &&
                message._creationTime - prevMessage._creationTime < 5 * 60 * 1000;
              return (
                <MessageItem
                  key={message._id}
                  message={message as Message}
                  isGrouped={!!isGrouped}
                />
              );
            })}
        </div>
      </ScrollArea>

      <TypingIndicator directMessage={id} />
      <MessageInput directMessage={id} />
    </div>
  );
}

function OnlineStatusDot({ userId }: { userId: Id<"users"> }) {
  const presenceData = useQuery(api.functions.presence.get, { userId });
  if (!presenceData?.online) return null;
  return (
    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 border-2 border-background" />
  );
}

function OnlineStatusText({ userId }: { userId: Id<"users"> }) {
  const presenceData = useQuery(api.functions.presence.get, { userId });
  return (
    <p className={cn("text-[11px] leading-tight font-medium", presenceData?.online ? "text-green-500" : "text-muted-foreground")}>
      {presenceData?.online ? "Online" : "Offline"}
    </p>
  );
}

function TypingIndicator({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const usernames = useQuery(api.functions.typing.list, { directMessage });
  if (!usernames || usernames.length === 0) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground/60 inline-block"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span>
        <span className="font-medium text-foreground/70">
          {usernames.join(", ")}
        </span>{" "}
        {usernames.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
}

type Message = FunctionReturnType<typeof api.functions.message.list>["page"][number];

function MessageItem({
  message,
  isGrouped,
}: {
  message: Message;
  isGrouped: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const user = useQuery(api.functions.user.get);
  const updateMessage = useMutation(api.functions.message.update);
  const toggleReaction = useMutation(api.functions.message.toggleReaction);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isOwnMessage = user && message.sender?._id === user._id;

  const handleEditSave = async () => {
    if (!editContent.trim()) return;
    try {
      await updateMessage({ id: message._id, content: editContent.trim() });
      setEditing(false);
    } catch (error) {
      toast.error("Failed to edit message");
    }
  };

  const handleReaction = async (emoji: string) => {
    setShowEmojiPicker(false);
    try {
      await toggleReaction({ id: message._id, emoji });
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  return (
    <motion.div
      initial={isGrouped ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group relative flex items-start px-4 gap-3 hover:bg-black/5 dark:hover:bg-white/[0.03] rounded-md mx-2 transition-colors",
        isGrouped ? "py-0.5 mt-0" : "py-2 mt-1"
      )}
    >
      {/* Avatar or spacer */}
      {!isGrouped ? (
        <Avatar className="size-9 border border-border/40 shadow-sm shrink-0 mt-0.5">
          {message.sender && <AvatarImage src={message.sender?.image} />}
          <AvatarFallback className="text-xs font-semibold">
            {message.sender?.username?.[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-9 shrink-0">
          {/* Timestamp on hover for grouped messages */}
          <span className="hidden group-hover:block text-[9px] text-muted-foreground/50 text-right leading-9 select-none">
            {new Date(message._creationTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      <div className="flex flex-col min-w-0 flex-1">
        {!isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <p className="text-[14px] font-semibold text-foreground">
              {message.sender?.username ?? "Deleted User"}
            </p>
            <span className="text-[10px] text-muted-foreground/70 font-medium">
              {new Date(message._creationTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {editing ? (
          <div className="flex flex-col gap-1.5 mt-0.5">
            <textarea
              className="w-full rounded-lg border border-primary/40 bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/60"
              value={editContent}
              rows={2}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSave();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-6 text-xs px-3"
                onClick={handleEditSave}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-3"
                onClick={() => {
                  setEditing(false);
                  setEditContent(message.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[14px] text-foreground/90 leading-relaxed break-words">
            {message.content}
            {message.edited && (
              <span className="ml-1.5 text-[10px] text-muted-foreground/50 italic">
                (edited)
              </span>
            )}
          </p>
        )}

        {message.attachment && (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="mt-2 w-fit max-w-[320px] rounded-xl overflow-hidden border border-border/50 shadow-sm cursor-pointer"
          >
            <Image
              src={message.attachment}
              width={320}
              height={240}
              className="object-cover"
              alt="Attachment"
            />
          </motion.div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((reaction) => {
              const hasReacted = user && reaction.users.includes(user._id);
              return (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-all",
                    hasReacted
                      ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400"
                      : "bg-muted/50 border-border/50 hover:bg-muted"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[11px]">{reaction.users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover action bar */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-background border border-border/60 rounded-lg shadow-sm p-0.5">
        {/* Emoji picker */}
        <div className="relative">
          <button
            className="p-1.5 rounded hover:bg-muted transition-colors"
            onClick={() => setShowEmojiPicker((v) => !v)}
            title="Add reaction"
          >
            <SmileIcon className="size-3.5 text-muted-foreground" />
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full right-0 mb-1 bg-popover border border-border rounded-xl shadow-lg p-2 flex gap-1 z-50"
              >
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="text-lg hover:scale-125 transition-transform rounded p-0.5"
                    onClick={() => handleReaction(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isOwnMessage && !editing && (
          <>
            <button
              className="p-1.5 rounded hover:bg-muted transition-colors"
              onClick={() => setEditing(true)}
              title="Edit message"
            >
              <EditIcon className="size-3.5 text-muted-foreground" />
            </button>
            <MessageDeleteButton message={message} />
          </>
        )}
      </div>
    </motion.div>
  );
}

function MessageDeleteButton({ message }: { message: Message }) {
  const removeMutation = useMutation(api.functions.message.remove);
  return (
    <button
      className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
      onClick={() => removeMutation({ id: message._id })}
      title="Delete message"
    >
      <TrashIcon className="size-3.5 text-red-400" />
    </button>
  );
}

function MessageInput({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const [content, setContent] = useState("");
  const sendMessage = useMutation(api.functions.message.create);
  const sendTypingIndicator = useMutation(api.functions.typing.upsert);
  const generateUploadUrl = useMutation(api.functions.message.generateUploadUrl);
  const [attachment, setAttachment] = useState<Id<"_storage">>();
  const [file, setFile] = useState<File>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [content]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    // Validate size (8 MB)
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large", { description: "Maximum file size is 8 MB" });
      return;
    }
    setFile(file);
    setIsUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, { method: "POST", body: file });
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      setAttachment(storageId);
    } catch {
      toast.error("Failed to upload image");
      setFile(undefined);
    } finally {
      setIsUploading(false);
    }
  };

  const clearAttachment = () => {
    setFile(undefined);
    setAttachment(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() && !attachment) return;
    try {
      await sendMessage({ directMessage, attachment, content: content.trim() });
      setContent("");
      setAttachment(undefined);
      setFile(undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Reset textarea height
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      toast.error("Failed to send message", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const hasContent = content.trim().length > 0 || !!attachment;

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 bg-muted/50 dark:bg-white/5 border border-border/50 rounded-2xl px-3 py-2.5 focus-within:border-primary/40 transition-all"
      >
        {/* Attach button */}
        <button
          type="button"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 mb-0.5"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image"
        >
          <PlusIcon className="size-4" />
          <span className="sr-only">Attach</span>
        </button>

        <div className="flex flex-col flex-1 gap-1.5 min-w-0">
          {/* Attachment preview */}
          {file && (
            <div className="relative w-fit">
              <div className="relative size-20 rounded-xl overflow-hidden border border-border/60 shadow-sm">
                <Image
                  src={URL.createObjectURL(file)}
                  fill
                  className="object-cover"
                  alt="Attachment preview"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <LoaderIcon className="animate-spin size-5 text-primary" />
                  </div>
                )}
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={clearAttachment}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </div>
          )}

          {/* Text input */}
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60 min-h-[22px] max-h-40 leading-relaxed"
            placeholder="Send a message..."
            value={content}
            rows={1}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
              if (content.length > 0) {
                sendTypingIndicator({ directMessage });
              }
            }}
          />
        </div>

        {/* Send button */}
        <AnimatePresence>
          {hasContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              className="shrink-0 mb-0.5"
            >
              <Button
                type="submit"
                size="icon"
                className="size-8 rounded-xl bg-indigo-500 hover:bg-indigo-600 shadow-sm"
                disabled={isUploading}
              >
                <SendIcon className="size-3.5" />
                <span className="sr-only">Send</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
        aria-label="Upload image"
      />

      <p className="text-[10px] text-muted-foreground/40 text-right mt-1 pr-1">
        {content.length}/2000 · Shift+Enter for new line
      </p>
    </div>
  );
}
