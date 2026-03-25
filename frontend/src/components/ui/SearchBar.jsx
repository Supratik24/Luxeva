import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { endpoints } from "../../services/api";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(endpoints.catalog.suggestions, {
          params: { q: query }
        });
        setSuggestions(data.suggestions || []);
      } catch (error) {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative hidden w-full max-w-md lg:block">
      <div className="glass flex items-center gap-3 rounded-full px-4 py-3">
        <Search size={16} className="text-ink/50 dark:text-white/50" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search premium essentials..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink/45 dark:placeholder:text-white/45"
        />
      </div>
      {suggestions.length ? (
        <div className="glass absolute inset-x-0 top-[calc(100%+0.75rem)] rounded-[1.5rem] p-3 shadow-soft">
          {suggestions.map((item) => (
            <Link
              key={item._id}
              to={`/product/${item.slug}`}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-ink/5 dark:hover:bg-white/5"
              onClick={() => setQuery("")}
            >
              <img
                src={item.images?.[0]?.url || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80"}
                alt={item.name}
                className="h-12 w-12 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.name}</p>
              </div>
              <Sparkles size={14} className="text-brass" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SearchBar;

