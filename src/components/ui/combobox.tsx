import * as React from "react";
import { Check, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ComboboxProps {
  users: User[];
  onSelect: (user: User) => void;
  onSearchChange: (search: string) => void;
  loading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  selectedUserId?: string;
  minCharacters?: number;
  searchTerm?: string;
}

export function Combobox({
  users,
  onSelect,
  onSearchChange,
  loading = false,
  placeholder = "Digite o nome do usuário...",
  emptyMessage = "Nenhum usuário encontrado",
  selectedUserId,
  minCharacters = 2,
  searchTerm = "",
}: ComboboxProps) {
  return (
    <Command className="border rounded-md">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder={placeholder}
          onValueChange={onSearchChange}
          value={searchTerm}
          className="border-0 focus:ring-0"
        />
      </div>
      <CommandList className="max-h-[300px]">
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Buscando usuários...
          </div>
        ) : searchTerm.length < minCharacters ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Digite pelo menos {minCharacters} caracteres
          </div>
        ) : (
          <>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {users.length > 0 && (
              <CommandGroup heading="Usuários">
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => onSelect(user)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">
                          {user.name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                      {selectedUserId === user.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </Command>
  );
}
