import {
  ArrowRight,
  Building2,
  Map,
  Search,
  Sparkles,
} from "lucide-react";

export default function HeroPanel({
  searchTerm,
  suggestions,
  stats,
  onSearchChange,
  onSuggestionSelect,
  onExplore,
  onViewMap,
}) {
  return (
    <section className="hero-panel" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="hero-icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div>
          <h1 id="hero-title">Find student services around U-Belt</h1>
          <p>
            Search printing shops, computer services, study spaces, dormitories, and campus help
            points from one fast student-focused map.
          </p>
        </div>
      </div>

      <div className="hero-search-block">
        <div className="hero-search">
          <Search size={20} />
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search offices, buildings, services, keywords"
            aria-label="Search offices, buildings, services, and keywords"
          />
        </div>
        {searchTerm && suggestions.length > 0 ? (
          <div className="search-suggestions hero-suggestions" role="listbox" aria-label="Search suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.store_id}
                type="button"
                onClick={() => onSuggestionSelect(suggestion)}
              >
                <span>{suggestion.name}</span>
                <small>{suggestion.displayCategory}</small>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hero-actions">
        <button className="hero-primary" type="button" onClick={onExplore}>
          <span>Explore Services</span>
          <ArrowRight size={17} />
        </button>
        <button className="hero-secondary" type="button" onClick={onViewMap}>
          <Map size={17} />
          <span>View Campus Map</span>
        </button>
      </div>

      <div className="hero-stats" aria-label="Map summary">
        <span>
          <strong>{stats.totalServices}</strong>
          Services
        </span>
        <span>
          <strong>{stats.openServices}</strong>
          Open
        </span>
        <span>
          <strong>{stats.categories}</strong>
          Categories
        </span>
        <span>
          <Building2 size={16} />
          U-Belt
        </span>
      </div>
    </section>
  );
}
