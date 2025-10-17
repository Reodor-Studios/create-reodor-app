"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TodoCard } from "./todo-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTodos, type TodoFilters } from "@/server/todo.actions";
import {
  Search,
  Filter,
  X,
  ListTodo,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface TodosListProps {
  userId: string;
  showFilters?: boolean;
}

export function TodosList({ userId, showFilters = true }: TodosListProps) {
  const limit = 10;
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Local filter state
  const [filters, setFilters] = useState<TodoFilters>({
    search: "",
    completed: undefined,
    priority: undefined,
    sortBy: "newest",
    page: 1,
    limit,
  });

  // Debounced search state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 250);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
      page: 1,
    }));
  }, [debouncedSearch]);

  const updateFilters = (newFilters: Partial<TodoFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  // Query with proper filters
  const { data, isLoading, error } = useQuery({
    queryKey: ["todos", userId, filters],
    queryFn: async () => {
      return await getTodos(userId, filters);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleCompletedFilterChange = (value: string) => {
    const completed =
      value === "all"
        ? undefined
        : value === "completed"
          ? true
          : value === "pending"
            ? false
            : undefined;
    updateFilters({ completed, page: 1 });
  };

  const handlePriorityFilterChange = (value: string) => {
    const priority =
      value === "all"
        ? undefined
        : (value as "low" | "medium" | "high");
    updateFilters({ priority, page: 1 });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sortBy: value as TodoFilters["sortBy"], page: 1 });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({
      search: "",
      completed: undefined,
      priority: undefined,
      sortBy: "newest",
      page: 1,
      limit,
    });
  };

  const hasActiveFilters =
    (filters.search && filters.search.length > 0) ||
    filters.completed !== undefined ||
    filters.priority ||
    (filters.sortBy && filters.sortBy !== "newest");

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Kunne ikke laste oppgaver. Prøv igjen senere.
        </p>
      </div>
    );
  }

  const isEmpty = !data?.data || data.data.length === 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with stats */}
      {data?.total !== undefined && (
        <Badge variant="secondary" className="text-xs sm:text-sm">
          {data.total} {data.total === 1 ? "oppgave" : "oppgaver"}
        </Badge>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={
                    isMobile ? "Søk..." : "Søk i oppgaver..."
                  }
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Second row: Status, Priority, and Sort filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
              {/* Completed filter */}
              <Select
                value={
                  filters.completed === undefined
                    ? "all"
                    : filters.completed
                      ? "completed"
                      : "pending"
                }
                onValueChange={handleCompletedFilterChange}
              >
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue
                    placeholder={isMobile ? "Status" : "Alle oppgaver"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle oppgaver</SelectItem>
                  <SelectItem value="pending">Uferdige</SelectItem>
                  <SelectItem value="completed">Fullførte</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority filter */}
              <Select
                value={filters.priority || "all"}
                onValueChange={handlePriorityFilterChange}
              >
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue
                    placeholder={isMobile ? "Prioritet" : "Alle prioriteter"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle prioriteter</SelectItem>
                  <SelectItem value="high">Høy</SelectItem>
                  <SelectItem value="medium">Middels</SelectItem>
                  <SelectItem value="low">Lav</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={filters.sortBy || "newest"}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={isMobile ? "Sortering" : "Sorter etter"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Nyeste først</SelectItem>
                  <SelectItem value="oldest">Eldste først</SelectItem>
                  <SelectItem value="due_date">Forfallsdato</SelectItem>
                  <SelectItem value="priority">Prioritet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <span className="text-xs sm:text-sm text-muted-foreground block">
                Aktive filtre:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {filters.search && filters.search.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Søk: {filters.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleSearchChange("")}
                    />
                  </Badge>
                )}
                {filters.completed !== undefined && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filters.completed ? "Fullførte" : "Uferdige"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        updateFilters({ completed: undefined, page: 1 })
                      }
                    />
                  </Badge>
                )}
                {filters.priority && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filters.priority === "high"
                      ? "Høy prioritet"
                      : filters.priority === "medium"
                        ? "Middels prioritet"
                        : "Lav prioritet"}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        updateFilters({ priority: undefined, page: 1 })
                      }
                    />
                  </Badge>
                )}
                {filters.sortBy && filters.sortBy !== "newest" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {filters.sortBy === "oldest"
                      ? "Eldste først"
                      : filters.sortBy === "due_date"
                        ? "Forfallsdato"
                        : filters.sortBy === "priority"
                          ? "Prioritet"
                          : filters.sortBy}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        updateFilters({ sortBy: "newest", page: 1 })
                      }
                    />
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  disabled={false}
                  className="text-xs sm:text-sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  {isMobile ? "Nullstill" : "Nullstill alle"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Todos, Loading, or Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-8 sm:py-12">
          <ListTodo className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">
            {hasActiveFilters
              ? "Ingen oppgaver funnet"
              : "Ingen oppgaver ennå"}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {hasActiveFilters
              ? "Prøv å justere filtrene dine for å se flere resultater."
              : "Du har ikke opprettet noen oppgaver ennå. Opprett din første oppgave for å komme i gang!"}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="mt-4"
            >
              <X className="w-4 h-4 mr-2" />
              Nullstill filtre
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((todo) => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isEmpty && data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent className="flex-wrap gap-1">
              {(filters.page || 1) > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange((filters.page || 1) - 1);
                    }}
                  />
                </PaginationItem>
              )}

              {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show fewer pages on mobile
                  const current = filters.page || 1;
                  if (isMobile) {
                    return (
                      page === 1 || page === data.totalPages || page === current
                    );
                  }
                  // Show current page, first page, last page, and pages around current
                  return (
                    page === 1 ||
                    page === data.totalPages ||
                    (page >= current - 1 && page <= current + 1)
                  );
                })
                .map((page, index, array) => {
                  // Add ellipsis if there's a gap
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && (
                        <PaginationItem>
                          <span className="px-3 py-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          isActive={page === (filters.page || 1)}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </div>
                  );
                })}

              {(filters.page || 1) < data.totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange((filters.page || 1) + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
