import { Bookmark, GraduationCap, LogIn, LogOut, MapPinPlus, UserRound } from "lucide-react";

export default function Header({
  user,
  showingBookmarks,
  onToggleBookmarks,
  onAddPlace,
  onLogin,
  onLogout,
}) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <GraduationCap size={25} strokeWidth={2.2} />
        </div>
        <span>Student Services Map</span>
      </div>

      <div className="header-actions">
        <button className="add-place-button" type="button" onClick={onAddPlace}>
          <MapPinPlus size={18} />
          <span>Add Service</span>
        </button>
        <button
          className={`bookmark-filter ${showingBookmarks ? "is-active" : ""}`}
          type="button"
          onClick={onToggleBookmarks}
        >
          <Bookmark size={18} />
          <span>My Bookmarks</span>
        </button>
        {user ? (
          <button className="profile-chip" type="button" onClick={onLogout} title="Log out">
            <UserRound size={18} />
            <div>
              <strong>{user.full_name}</strong>
              <span>{user.role || "Student"}</span>
            </div>
            <LogOut size={16} />
          </button>
        ) : (
          <button className="login-button" type="button" onClick={onLogin}>
            <LogIn size={18} />
            <span>Log In</span>
          </button>
        )}
      </div>
    </header>
  );
}
