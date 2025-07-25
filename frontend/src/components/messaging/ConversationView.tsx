import React, { useState, useEffect, useCallback } from "react";
import { Hash, Volume2, Users, X, ArrowLeft } from "lucide-react";
import Avatar from "../ui/Avatar";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import {
  ConversationService,
  type Conversation,
} from "../../services/conversations";
import { MessageService } from "../../services/messages";
import type { User } from "../../types/database";
import { useAuth } from "../../contexts/AuthContext";
import { useRealtimeMessages } from "../../hooks/useRealtimeMessages";

interface ConversationSelection {
  type: "friend" | "conversation";
  friend?: User;
  conversationId?: string;
}

interface ConversationViewProps {
  selection: ConversationSelection;
  onToggleMembers: () => void;
  onClose: () => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  selection,
  onToggleMembers,
  onClose,
}) => {
  const { profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time message handlers
  const handleNewMessage = useCallback((message: any) => {
    console.log("New message received in real-time:", message);
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleMessageUpdate = useCallback((message: any) => {
    console.log("Message updated in real-time:", message);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === message.id ? message : msg))
    );
  }, []);

  const handleMessageDelete = useCallback((messageId: string) => {
    console.log("Message deleted in real-time:", messageId);
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  // Set up real-time subscription
  useRealtimeMessages({
    conversationId: conversation?.id,
    roomId: undefined, // This is for DM, not rooms
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate,
    onMessageDelete: handleMessageDelete,
  });

  // Determine conversation partner for display
  const conversationPartner =
    selection.friend ||
    (conversation && profile
      ? ConversationService.getOtherParticipant(conversation, profile.id)
      : null);

  useEffect(() => {
    loadConversationData();
  }, [selection]);

  const loadConversationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (selection.type === "conversation" && selection.conversationId) {
        // Load existing conversation
        const conv = await ConversationService.getConversation(
          selection.conversationId
        );
        setConversation(conv);
        await loadMessages(selection.conversationId);
      } else if (selection.type === "friend" && selection.friend) {
        // Check if conversation exists with this friend
        try {
          const conv = await ConversationService.createConversation(
            selection.friend.username
          );
          setConversation(conv);
          await loadMessages(conv.id);
        } catch (error: any) {
          // If conversation doesn't exist yet, that's fine - we'll create it on first message
          if (
            error.message.includes("not found") ||
            error.message.includes("does not exist")
          ) {
            setConversation(null);
            setMessages([]);
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading conversation:", error);
      setError(error.message || "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (
    conversationId: string,
    isLoadingMore = false
  ) => {
    try {
      if (isLoadingMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingMessages(true);
        setMessages([]); // Clear messages when loading fresh
      }

      // For "load more", get the oldest message timestamp as "before" parameter
      const before =
        isLoadingMore && messages.length > 0
          ? messages[0].created_at
          : undefined;

      const response = await MessageService.getDMMessages(
        conversationId,
        50, // limit
        0, // offset (always 0 when using before pagination)
        before
      );

      if (isLoadingMore) {
        // Prepend older messages to the beginning of the array
        setMessages((prev) => [...response.messages, ...prev]);
      } else {
        // Replace messages with fresh load
        setMessages(response.messages);
      }

      setHasMore(response.has_more);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      if (!isLoadingMore) {
        // Don't clear messages on load more error
        setMessages([]);
      }
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (conversation?.id && !isLoadingMore) {
      loadMessages(conversation.id, true);
    }
  }, [conversation?.id, isLoadingMore, messages]);

  const handleSendMessage = async (content: any) => {
    try {
      if (!conversationPartner || !profile) return;

      let conversationId = conversation?.id;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const newConversation = await ConversationService.createConversation(
          conversationPartner.username
        );
        setConversation(newConversation);
        conversationId = newConversation.id;
      }

      // Send the message using the new DM-specific endpoint
      const sentMessage = await MessageService.sendDMMessage(
        conversationId,
        content
      );

      // The message will be automatically added via real-time subscription
      // No need to reload all messages
      console.log("Message sent successfully:", sentMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(error.message || "Failed to send message");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-gray-500 dark:text-gray-400">
          Loading conversation...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-red-500">Error loading conversation</div>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">Failed to load conversation</div>
            <div className="text-gray-500 text-sm">{error}</div>
            <button
              onClick={loadConversationData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800 h-full max-h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {conversationPartner && (
            <>
              <Avatar
                name={
                  conversationPartner.display_name ||
                  conversationPartner.username
                }
                src={conversationPartner.avatar_url || undefined}
                size="sm"
                showStatus
                status={conversationPartner.status as any}
                statusColor={conversationPartner.status_color}
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {conversationPartner.display_name ||
                    conversationPartner.username}
                </h3>
                {conversationPartner.status_text && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {conversationPartner.status_text}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMembers}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Users className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area - Main flex container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {conversation ? (
          <>
            {/* Message List - Scrollable area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <MessageList
                messages={messages}
                isLoading={isLoadingMessages}
                conversationId={conversation.id}
                hasMore={hasMore}
                onLoadMore={handleLoadMore}
                isLoadingMore={isLoadingMore}
              />
            </div>

            {/* Message Composer - Fixed at bottom */}
            <div className="flex-shrink-0">
              <MessageComposer
                onSendMessage={handleSendMessage}
                placeholder={`Message ${
                  conversationPartner?.display_name ||
                  conversationPartner?.username ||
                  "friend"
                }`}
              />
            </div>
          </>
        ) : (
          <>
            {/* Empty State - No conversation yet */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
              <div className="text-center max-w-md">
                {conversationPartner && (
                  <>
                    <Avatar
                      name={
                        conversationPartner.display_name ||
                        conversationPartner.username
                      }
                      src={conversationPartner.avatar_url || undefined}
                      size="xl"
                      showStatus
                      status={conversationPartner.status as any}
                      statusColor={conversationPartner.status_color}
                      className="mx-auto mb-4"
                    />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {conversationPartner.display_name ||
                        conversationPartner.username}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      This is the beginning of your direct message history with{" "}
                      <span className="font-medium">
                        {conversationPartner.display_name ||
                          conversationPartner.username}
                      </span>
                      .
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Message Composer - Fixed at bottom */}
            <div className="flex-shrink-0">
              <MessageComposer
                onSendMessage={handleSendMessage}
                placeholder={`Send a message to start your conversation with ${
                  conversationPartner?.display_name ||
                  conversationPartner?.username ||
                  "friend"
                }`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
