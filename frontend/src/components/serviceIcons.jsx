import {
  BadgeDollarSign,
  Bed,
  BookOpen,
  BriefcaseBusiness,
  Coffee,
  FileCheck2,
  HeartPulse,
  Landmark,
  Monitor,
  Printer,
  School,
  Store,
  UserRoundCheck,
} from "lucide-react";

export function getServiceIcon(displayCategory) {
  if (displayCategory === "Printing") return Printer;
  if (displayCategory === "Computer Shop") return Monitor;
  if (displayCategory === "Study Hub") return BookOpen;
  if (displayCategory === "Dormitory") return Bed;
  if (displayCategory === "Cafe") return Coffee;
  if (displayCategory === "Office") return BriefcaseBusiness;
  if (displayCategory === "Clinic") return HeartPulse;
  if (displayCategory === "Library") return BookOpen;
  if (displayCategory === "Cashier") return BadgeDollarSign;
  if (displayCategory === "Guidance") return UserRoundCheck;
  if (displayCategory === "Admissions") return School;
  if (displayCategory === "Registrar") return FileCheck2;
  if (displayCategory === "Administration") return Landmark;
  return Store;
}

export function ServiceIcon({ category, size = 24, strokeWidth = 2.1 }) {
  const Icon = getServiceIcon(category);
  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />;
}
