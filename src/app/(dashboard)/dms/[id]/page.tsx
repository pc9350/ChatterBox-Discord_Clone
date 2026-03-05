"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import {
    LoaderIcon,
    MoreVerticalIcon,
    PlusIcon,
    SendIcon,
    TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { use, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function MessagePage({
  params,
}: {
  params: Promise<{ id: Id<"directMessages"> }>;
}) {
  const { id } = use(params);

  const directMessage = useQuery(api.functions.dm.get, {
    id,
  });
  
  const { results: messages, status, loadMore } = usePaginatedQuery(
    api.functions.message.list,
    { directMessage: id },
    { initialNumItems: 50 }
  );

  if (!directMessage) return null;

  return (
    <div className="flex flex-1 flex-col divide-y max-h-screen">
      <header className="flex items-center gap-2 p-4">
        <Avatar className="size-8 border">
          <AvatarImage src={directMessage.user.image} />
          <AvatarFallback />
        </Avatar>
        <h1 className="font-semibold">{directMessage.user.username}</h1>
      </header>
      <ScrollArea className="h-full py-4 flex-1">
        <div className="flex flex-col gap-2">
           {status === "CanLoadMore" && (
            <div className="flex justify-center py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMore(50)}
              >
                Load More
              </Button>
            </div>
           )}
           {status === "LoadingMore" && (
            <div className="flex justify-center py-2">
              <LoaderIcon className="animate-spin size-4 text-muted-foreground" />
            </div>
           )}
           
          {messages?.slice().reverse().map((message) => (
            <MessageItem key={message._id} message={message as Message} />
          ))}
        </div>
      </ScrollArea>
      <TypingIndicator directMessage={id} />
      <MessageInput directMessage={id} />
    </div>
  );
}

function TypingIndicator({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const usernames = useQuery(api.functions.typing.list, {
    directMessage,
  });
  if (!usernames || usernames.length === 0) return null;
  return (
    <div className="text-sm text-muted-foreground px-4 py-2">
      {usernames.join(", ")} is typing...
    </div>
  );
}

type Message = FunctionReturnType<typeof api.functions.message.list>["page"][number];

import { motion } from "framer-motion";

function MessageItem({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex items-center px-4 gap-3 py-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-md mx-2 transition-colors cursor-pointer"
    >
      <Avatar className="size-10 border shadow-sm">
        {message.sender && <AvatarImage src={message.sender?.image} />}
        <AvatarFallback />
      </Avatar>
      <div className="flex flex-col mr-auto w-full">
        <div className="flex items-baseline gap-2">
          <p className="text-[15px] font-medium text-foreground">
            {message.sender?.username ?? "Deleted User"}
          </p>
          <span className="text-[11px] text-muted-foreground font-medium">
            {new Date(message._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[15px] text-foreground/90 leading-relaxed mt-0.5">{message.content}</p>
        {message.attachment && (
          <motion.div whileHover={{ scale: 1.01 }} className="mt-2 text-left w-fit max-w-[80%] rounded-lg overflow-hidden border shadow-sm cursor-pointer">
            <Image
              src={message.attachment}
              width={300}
              height={300}
              className="object-cover"
              alt="Attachment"
            />
          </motion.div>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <MessageActions message={message} />
      </div>
    </motion.div>
  );
}

function MessageActions({ message }: { message: Message }) {
  const user = useQuery(api.functions.user.get);
  const removeMutation = useMutation(api.functions.message.remove);

  if (!user || message.sender?._id !== user._id) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreVerticalIcon className="size-4 text-muted-foreground" />
        <span className="sr-only">Message Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => removeMutation({ id: message._id })}
        >
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const generateUploadUrl = useMutation(
    api.functions.message.generateUploadUrl
  );
  const [attachment, setAttachment] = useState<Id<"_storage">>();
  const [file, setFile] = useState<File>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setIsUploading(true);
    const url = await generateUploadUrl();
    const res = await fetch(url, {
      method: "POST",
      body: file,
    });
    const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
    setAttachment(storageId);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendMessage({ directMessage, attachment, content });
      setContent("");
      setAttachment(undefined);
      setFile(undefined);
    } catch (error) {
      toast.error("Failed to send message", {
        description:
          error instanceof Error ? error.message : "An unknown error occured",
      });
    }
  };

  return (
    <>
      <form className="flex items-end gap-2 p-4" onSubmit={handleSubmit}>
        <Button
          type="button"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
        >
          <PlusIcon />
          <span className="sr-only">Attach</span>
        </Button>
        <div className="flex flex-col flex-1 gap-2">
          {file && <ImagePreview file={file} isUploading={isUploading} />}
          <Input
            placeholder="Message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={() => {
              if (content.length > 0) {
                sendTypingIndicator({ directMessage });
              }
            }}
          />
        </div>
        <Button size="icon">
          <SendIcon />
          <span className="sr-only">Send</span>
        </Button>
      </form>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
        aria-label="Upload attachment"
      />
    </>
  );
}

function ImagePreview({
  file,
  isUploading,
}: {
  file: File;
  isUploading: boolean;
}) {
  return (
    <div className="relative size-40 overflow-hidden rounded border">
      <Image
        src={URL.createObjectURL(file)}
        width={300}
        height={300}
        alt="Attachment"
      />
      {isUploading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <LoaderIcon className="animate-spin size-8" />
        </div>
      )}
    </div>
  );
}
