import { Bookmark, List, Map, UserRound } from "lucide-react";

const tabs = [
  { id: "map", label: "Map", icon: Map },
  { id: "list", label: "List", icon: List },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "me", label: "Me", icon: UserRound },
];

export default function MobileTabs({ activeView, onViewChange, onBookmarksView }) {
  return (
    <nav className="mobile-tabs" aria-label="Mobile app navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            className={isActive ? "is-active" : ""}
            type="button"
            onClick={() => {
              if (tab.id === "bookmarks") {
                onBookmarksView();
                return;
              }
              onViewChange(tab.id === "me" ? "detail" : tab.id);
            }}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
