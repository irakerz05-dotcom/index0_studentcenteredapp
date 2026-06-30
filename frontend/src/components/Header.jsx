import { Bookmark, ChevronDown, GraduationCap, UserRound } from "lucide-react";

export default function Header({ showingBookmarks, onToggleBookmarks }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <GraduationCap size={25} strokeWidth={2.2} />
        </div>
        <span>Student Services Map</span>
      </div>

      <div className="header-actions">
        <button
          className={`bookmark-filter ${showingBookmarks ? "is-active" : ""}`}
          type="button"
          onClick={onToggleBookmarks}
        >
          <Bookmark size={18} />
          <span>My Bookmarks</span>
        </button>
        <div className="profile-chip">
          <UserRound size={18} />
          <div>
            <strong>John Doe</strong>
            <span>Student</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}
