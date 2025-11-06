"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useConversations } from "@/hooks/use-conversations";
import { useDebounce } from "@/hooks/use-debounce";
import { ChatHistoryCard } from "@/components/chat/chat-history-card";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  MessageSquarePlusIcon,
  SearchIcon,
  XIcon,
  FilterIcon,
} from "lucide-react";
import Link from "next/link";
import { BlurFade } from "@/components/ui/blur-fade";
import type { ConversationFilters } from "@/server/conversation.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ChatHistoryContentProps {
  userId: string;
}

const ITEMS_PER_PAGE = 12;

export function ChatHistoryContent({ userId }: ChatHistoryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL parameters
  const pageParam = searchParams.get("page");
  const searchParam = searchParams.get("search");
  const sortByParam = searchParams.get("sortBy");
  const pinnedParam = searchParams.get("pinned");

  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">(
    (sortByParam as "newest" | "oldest") || "newest"
  );
  const [pinnedFilter, setPinnedFilter] = useState<boolean | undefined>(
    pinnedParam === "true" ? true : pinnedParam === "false" ? false : undefined
  );
  const [currentPage, setCurrentPage] = useState(
    pageParam ? parseInt(pageParam) : 1
  );

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    if (pinnedFilter !== undefined)
      params.set("pinned", pinnedFilter.toString());

    const queryString = params.toString();
    const newUrl = queryString
      ? `/chat/history?${queryString}`
      : "/chat/history";
    router.replace(newUrl, { scroll: false });
  }, [currentPage, debouncedSearch, sortBy, pinnedFilter, router]);

  // Build filters for the query
  const filters: ConversationFilters = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  };

  // Only include sortBy if it's not the default
  if (sortBy !== "newest") {
    filters.sortBy = sortBy;
  }

  if (debouncedSearch) {
    filters.search = debouncedSearch;
  }

  if (pinnedFilter !== undefined) {
    filters.pinned = pinnedFilter;
  }

  // Fetch conversations
  console.log("[ChatHistory] Fetching with filters:", filters);
  const { data: conversationsData, isLoading } = useConversations({
    userId,
    filters,
  });
  console.log("[ChatHistory] Query result:", { conversationsData, isLoading });

  const conversations = conversationsData?.data || [];
  const total = conversationsData?.total || 0;
  const totalPages = conversationsData?.totalPages || 1;

  // Reset to page 1 when search or filters change
  useEffect(() => {
    if (currentPage > 1 && conversations.length === 0 && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [debouncedSearch, sortBy, pinnedFilter]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setPinnedFilter(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" || sortBy !== "newest" || pinnedFilter !== undefined;

  // Generate pagination links
  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(
          "ellipsis",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        // In the middle
        pages.push(
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages
        );
      }
    }

    return pages;
  };

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sortBy !== "newest") params.set("sortBy", sortBy);
    if (pinnedFilter !== undefined)
      params.set("pinned", pinnedFilter.toString());

    const queryString = params.toString();
    return queryString ? `/chat/history?${queryString}` : "/chat/history";
  };

  const handleNewChat = () => {
    router.push("/chat");
  };

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "20rem",
          "--sidebar-width-mobile": "20rem",
        } as React.CSSProperties
      }
    >
      <div className="flex w-full">
        <ChatSidebar
          userId={userId}
          currentConversationId={undefined}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />

        <SidebarInset className="flex pt-28 md:pt-16 flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-6">
              {/* Header */}
              <BlurFade delay={0.1} duration={0.5} inView>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold">Your Chat History</h1>
                </div>
              </BlurFade>

              {/* Search and Filter Bar */}
              <BlurFade delay={0.15} duration={0.5} inView>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search your chats..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearSearch}
                        className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                      >
                        <XIcon className="size-4" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <FilterIcon className="size-4" />
                        <span className="hidden sm:inline">Filter</span>
                        {hasActiveFilters && (
                          <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs">
                            {(searchQuery ? 1 : 0) +
                              (sortBy !== "newest" ? 1 : 0) +
                              (pinnedFilter !== undefined ? 1 : 0)}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortBy("newest");
                          setCurrentPage(1);
                        }}
                      >
                        <span
                          className={sortBy === "newest" ? "font-semibold" : ""}
                        >
                          Newest first
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortBy("oldest");
                          setCurrentPage(1);
                        }}
                      >
                        <span
                          className={sortBy === "oldest" ? "font-semibold" : ""}
                        >
                          Oldest first
                        </span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuLabel>Show</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setPinnedFilter(undefined);
                          setCurrentPage(1);
                        }}
                      >
                        <span
                          className={
                            pinnedFilter === undefined ? "font-semibold" : ""
                          }
                        >
                          All conversations
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setPinnedFilter(true);
                          setCurrentPage(1);
                        }}
                      >
                        <span
                          className={
                            pinnedFilter === true ? "font-semibold" : ""
                          }
                        >
                          Pinned only
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setPinnedFilter(false);
                          setCurrentPage(1);
                        }}
                      >
                        <span
                          className={
                            pinnedFilter === false ? "font-semibold" : ""
                          }
                        >
                          Unpinned only
                        </span>
                      </DropdownMenuItem>

                      {hasActiveFilters && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleClearFilters}>
                            Clear all filters
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </BlurFade>

              {/* Stats */}
              <BlurFade delay={0.2} duration={0.5} inView>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? (
                      <Skeleton className="h-5 w-32 inline-block" />
                    ) : (
                      <>
                        {total} conversation{total !== 1 ? "s" : ""}
                        {debouncedSearch && " found"}
                      </>
                    )}
                  </p>
                </div>
              </BlurFade>

              {/* Conversation Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <BlurFade key={i} delay={i * 0.05} duration={0.5} inView>
                      <Skeleton className="h-40 w-full rounded-lg" />
                    </BlurFade>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <BlurFade delay={0.25} duration={0.5} inView>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquarePlusIcon className="size-12 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      {debouncedSearch || hasActiveFilters
                        ? "No conversations found"
                        : "No conversations yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {debouncedSearch || hasActiveFilters
                        ? "Try adjusting your search or filters"
                        : "Start a new chat to begin"}
                    </p>
                    {hasActiveFilters ? (
                      <Button variant="outline" onClick={handleClearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button asChild>
                        <Link href="/chat">
                          <MessageSquarePlusIcon className="size-4" />
                          <span>New Chat</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </BlurFade>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {conversations.map((conversation, index) => (
                      <BlurFade
                        key={conversation.id}
                        delay={index * 0.05}
                        duration={0.5}
                        inView
                      >
                        <ChatHistoryCard conversation={conversation} />
                      </BlurFade>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <BlurFade delay={0.3} duration={0.5} inView>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href={
                                currentPage > 1
                                  ? buildPageUrl(currentPage - 1)
                                  : "#"
                              }
                              aria-disabled={currentPage === 1}
                              className={
                                currentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>

                          {generatePageNumbers().map((page, index) => (
                            <PaginationItem key={index}>
                              {page === "ellipsis" ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  href={buildPageUrl(page)}
                                  isActive={page === currentPage}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(page);
                                  }}
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              href={
                                currentPage < totalPages
                                  ? buildPageUrl(currentPage + 1)
                                  : "#"
                              }
                              aria-disabled={currentPage === totalPages}
                              className={
                                currentPage === totalPages
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </BlurFade>
                  )}
                </>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
