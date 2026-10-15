// The app's icon set: Lucide (https://lucide.dev), imported per icon so only
// these end up in the bundle. Bundled locally, so it works offline.
//
// Add an icon here before using it: <Icon name="…"> only accepts these keys,
// so a misspelled name is a type error instead of a blank square.
import ArrowDown from "lucide-solid/icons/arrow-down";
import ArrowDownUp from "lucide-solid/icons/arrow-down-up";
import ArrowUp from "lucide-solid/icons/arrow-up";
import Braces from "lucide-solid/icons/braces";
import BrushCleaning from "lucide-solid/icons/brush-cleaning";
import Calendar from "lucide-solid/icons/calendar";
import CalendarOff from "lucide-solid/icons/calendar-off";
import CalendarRange from "lucide-solid/icons/calendar-range";
import CalendarX from "lucide-solid/icons/calendar-x";
import Check from "lucide-solid/icons/check";
import ChevronDown from "lucide-solid/icons/chevron-down";
import ChevronLeft from "lucide-solid/icons/chevron-left";
import ChevronRight from "lucide-solid/icons/chevron-right";
import ChevronsDown from "lucide-solid/icons/chevrons-down";
import ChevronsUp from "lucide-solid/icons/chevrons-up";
import CircleAlert from "lucide-solid/icons/circle-alert";
import CircleCheck from "lucide-solid/icons/circle-check";
import EllipsisVertical from "lucide-solid/icons/ellipsis-vertical";
import Equal from "lucide-solid/icons/equal";
import Flag from "lucide-solid/icons/flag";
import FolderOpen from "lucide-solid/icons/folder-open";
import Inbox from "lucide-solid/icons/inbox";
import Layers from "lucide-solid/icons/layers";
import Menu from "lucide-solid/icons/menu";
import ListFilter from "lucide-solid/icons/list-filter";
import Merge from "lucide-solid/icons/merge";
import Moon from "lucide-solid/icons/moon";
import PaintBucket from "lucide-solid/icons/paint-bucket";
import Palette from "lucide-solid/icons/palette";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import Search from "lucide-solid/icons/search";
import SearchX from "lucide-solid/icons/search-x";
import Sparkles from "lucide-solid/icons/sparkles";
import Sun from "lucide-solid/icons/sun";
import SunMoon from "lucide-solid/icons/sun-moon";
import SwatchBook from "lucide-solid/icons/swatch-book";
import Table from "lucide-solid/icons/table";
import Tag from "lucide-solid/icons/tag";
import Trash from "lucide-solid/icons/trash";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import X from "lucide-solid/icons/x";

export const ICONS = {
  "arrow-down": ArrowDown,
  "arrow-down-up": ArrowDownUp,
  "arrow-up": ArrowUp,
  braces: Braces,
  "brush-cleaning": BrushCleaning,
  calendar: Calendar,
  "calendar-off": CalendarOff,
  "calendar-range": CalendarRange,
  "calendar-x": CalendarX,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevrons-down": ChevronsDown,
  "chevrons-up": ChevronsUp,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  "ellipsis-vertical": EllipsisVertical,
  equal: Equal,
  flag: Flag,
  "folder-open": FolderOpen,
  inbox: Inbox,
  layers: Layers,
  "list-filter": ListFilter,
  menu: Menu,
  merge: Merge,
  moon: Moon,
  "paint-bucket": PaintBucket,
  palette: Palette,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  "search-x": SearchX,
  sparkles: Sparkles,
  sun: Sun,
  "sun-moon": SunMoon,
  "swatch-book": SwatchBook,
  table: Table,
  tag: Tag,
  trash: Trash,
  "triangle-alert": TriangleAlert,
  x: X,
};

export type IconName = keyof typeof ICONS;
