import { useRef } from "react";
import { Bookmark, GraduationCap, LogIn, LogOut, MapPinPlus, Square, UserRound } from "lucide-react";

export default function Header({
  user,
  isNavigating,
  showingBookmarks,
  onToggleBookmarks,
  onAddPlace,
  onStopNavigation,
  onLogin,
  onLogout,
}) {
  const pointerActivatedRef = useRef(false);
  const pointerResetRef = useRef(null);

  function handlePointerAction(action) {
    return () => {
      pointerActivatedRef.current = true;

      if (pointerResetRef.current) {
        window.clearTimeout(pointerResetRef.current);
      }

      pointerResetRef.current = window.setTimeout(() => {
        pointerActivatedRef.current = false;
      }, 500);

      action?.();
    };
  }

  function handleClickAction(action) {
    return () => {
      if (pointerActivatedRef.current) {
        pointerActivatedRef.current = false;

        if (pointerResetRef.current) {
          window.clearTimeout(pointerResetRef.current);
          pointerResetRef.current = null;
        }

        return;
      }

      action?.();
    };
  }

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <GraduationCap size={25} strokeWidth={2.2} />
        </div>
        <span>Student Services Map</span>
      </div>

      <div className="header-actions">
        {isNavigating ? (
          <button
            className="stop-gps-button"
            type="button"
            onPointerDown={handlePointerAction(onStopNavigation)}
            onClick={handleClickAction(onStopNavigation)}
          >
            <Square size={16} fill="currentColor" />
            <span>Stop GPS</span>
          </button>
        ) : null}
        <button
          className="add-place-button"
          type="button"
          onPointerDown={handlePointerAction(onAddPlace)}
          onClick={handleClickAction(onAddPlace)}
        >
          <MapPinPlus size={18} />
          <span>Add Service</span>
        </button>
        <button
          className={`bookmark-filter ${showingBookmarks ? "is-active" : ""}`}
          type="button"
          onPointerDown={handlePointerAction(onToggleBookmarks)}
          onClick={handleClickAction(onToggleBookmarks)}
        >
          <Bookmark size={18} />
          <span>My Bookmarks</span>
        </button>
        {user ? (
          <button
            className="profile-chip"
            type="button"
            onPointerDown={handlePointerAction(onLogout)}
            onClick={handleClickAction(onLogout)}
            title="Log out"
          >
            <UserRound size={18} />
            <div>
              <strong>{user.full_name}</strong>
              <span>{user.role || "Student"}</span>
            </div>
            <LogOut size={16} />
          </button>
        ) : (
          <button
            className="login-button"
            type="button"
            onPointerDown={handlePointerAction(onLogin)}
            onClick={handleClickAction(onLogin)}
          >
            <LogIn size={18} />
            <span>Log In</span>
          </button>
        )}
      </div>
    </header>
  );
}
