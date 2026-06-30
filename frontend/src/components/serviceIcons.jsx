import {
  Bed,
  BookOpen,
  Coffee,
  Monitor,
  Printer,
  Store,
} from "lucide-react";

export function getServiceIcon(displayCategory) {
  if (displayCategory === "Printing") return Printer;
  if (displayCategory === "Computer Shop") return Monitor;
  if (displayCategory === "Study Hub") return BookOpen;
  if (displayCategory === "Dormitory") return Bed;
  if (displayCategory === "Cafe") return Coffee;
  return Store;
}

export function ServiceIcon({ category, size = 24, strokeWidth = 2.1 }) {
  const Icon = getServiceIcon(category);
  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />;
}
