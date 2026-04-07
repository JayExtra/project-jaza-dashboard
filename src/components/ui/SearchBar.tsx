import { Search } from 'lucide-react';

export const SearchBar = () => {
  return (
    <div className="flex items-center gap-2 text-foreground/40 w-full max-w-md">
      <Search size={20} />
      <input 
        type="text" 
        placeholder="Search something..." 
        className="bg-transparent border-none outline-none text-lg w-full placeholder:text-foreground/40 text-foreground"
      />
    </div>
  );
};
