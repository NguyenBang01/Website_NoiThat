import React, { useState } from 'react';
import { Search } from 'lucide-react';

export default function HeaderSearchBar() {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-72 sm:w-80 md:w-96">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#e8f7ee] hover:bg-[#ddf3e5] focus:bg-white border border-[#bbf0cb] focus:border-brand-500 text-warm-900 placeholder-warm-600 text-sm outline-hidden transition shadow-2xs"
        />
        <Search className="w-4 h-4 text-warm-600 absolute left-3.5 pointer-events-none" />
      </div>
    </form>
  );
}
