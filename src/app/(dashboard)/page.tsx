import { TooltipProvider } from "@/components/ui/tooltip";
import { AddFriend } from "./_components/add-friend";
import {
  AcceptedFriendsList,
  PendingFriendsList,
} from "./_components/friends-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FriendsPage() {
  return (
    <div className="flex-1 flex-col flex max-h-screen overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-base">Friends</h1>
        </div>
        <AddFriend />
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <TooltipProvider delayDuration={0}>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Friends</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <AcceptedFriendsList />
              </TabsContent>
              <TabsContent value="pending">
                <PendingFriendsList />
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
