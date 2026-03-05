"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckIcon, MessageCircleIcon, UserX, XIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PendingFriendsList() {
  const friends = useQuery(api.functions.friend.listPending);
  const updateStatus = useMutation(api.functions.friend.updateStatus);

  return (
    <div className="flex flex-col gap-1">
      {friends?.length === 0 ? (
        <FriendListEmpty icon="📬">
          No pending friend requests
        </FriendListEmpty>
      ) : (
        <AnimatePresence initial={false}>
          {friends?.map((friend, index) => (
            <motion.div
              key={friend._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <FriendItem username={friend.user.username} image={friend.user.image}>
                <IconButton
                  title="Accept"
                  icon={<CheckIcon className="size-3.5" />}
                  className="border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  onClick={() => updateStatus({ id: friend._id, status: "accepted" })}
                />
                <IconButton
                  title="Decline"
                  icon={<XIcon className="size-3.5" />}
                  className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  onClick={() => updateStatus({ id: friend._id, status: "rejected" })}
                />
              </FriendItem>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

export function AcceptedFriendsList() {
  const friends = useQuery(api.functions.friend.listAccepted);
  const updateStatus = useMutation(api.functions.friend.updateStatus);
  const createDm = useMutation(api.functions.dm.create);
  const router = useRouter();

  const handleStartDm = async (username: string) => {
    try {
      const id = await createDm({ username });
      router.push(`/dms/${id}`);
    } catch (error) {
      toast.error("Failed to open DM", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {friends?.length === 0 ? (
        <FriendListEmpty icon="👥">
          No friends yet — add someone!
        </FriendListEmpty>
      ) : (
        <AnimatePresence initial={false}>
          {friends?.map((friend, index) => (
            <motion.div
              key={friend._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <FriendItem username={friend.user.username} image={friend.user.image}>
                <IconButton
                  title="Send Message"
                  icon={<MessageCircleIcon className="size-3.5" />}
                  className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                  onClick={() => handleStartDm(friend.user.username)}
                />
                <IconButton
                  title="Remove Friend"
                  icon={<UserX className="size-3.5" />}
                  className="border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  onClick={() => updateStatus({ id: friend._id, status: "rejected" })}
                />
              </FriendItem>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

function FriendListEmpty({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 gap-3 text-center"
    >
      <div className="text-4xl">{icon}</div>
      <p className="text-sm text-muted-foreground max-w-[180px]">{children}</p>
    </motion.div>
  );
}

function IconButton({
  title,
  className,
  icon,
  onClick,
}: {
  title: string;
  className?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn("rounded-full size-8 border", className)}
          variant="outline"
          size="icon"
          onClick={onClick}
        >
          {icon}
          <span className="sr-only">{title}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}

function FriendItem({
  username,
  image,
  children,
}: {
  username: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors gap-3 group">
      <div className="flex items-center gap-3">
        <Avatar className="size-9 border border-border/50">
          <AvatarImage src={image} />
          <AvatarFallback className="text-sm font-medium">
            {username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{username}</p>
          <p className="text-xs text-muted-foreground">Friend</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {children}
      </div>
    </div>
  );
}
