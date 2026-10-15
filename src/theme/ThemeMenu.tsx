import { For } from "solid-js";
import { Icon } from "~/components/ui/icon";
import { iconButtonVariants } from "~/components/ui/icon-button";
import {
  Menu,
  MenuContent,
  MenuDivider,
  MenuGroup,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "~/components/ui/menu";
import type { ColorStyle } from "./scheme";
import { TEXT_SIZES, type TextSize } from "./text-size";
import type { ThemeMode } from "./types";
import { useTheme } from "./use-theme";
import type { IconName } from "~/components/ui/icons";

const MODES: { value: ThemeMode; label: string; icon: IconName }[] = [
  { value: "system", label: "System", icon: "sun-moon" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

const STYLES: { value: ColorStyle; label: string; icon: IconName }[] = [
  { value: "content", label: "Match accent", icon: "paint-bucket" },
  { value: "tonalSpot", label: "Tonal spot", icon: "palette" },
  { value: "vibrant", label: "Vibrant", icon: "swatch-book" },
];

export function ThemeMenu() {
  const theme = useTheme();

  return (
    <Menu>
      <MenuTrigger aria-label="Appearance" class={iconButtonVariants()}>
        <Icon name="palette" size={24} />
      </MenuTrigger>
      <MenuContent class="min-w-[15rem]">
        <MenuGroup>
          <MenuLabel>Theme</MenuLabel>
          <MenuRadioGroup value={theme.mode()} onChange={(v) => theme.setMode(v as ThemeMode)}>
            <For each={MODES}>
              {(m) => (
                <MenuRadioItem value={m.value} icon={m.icon}>
                  {m.label}
                </MenuRadioItem>
              )}
            </For>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuDivider />
        <MenuGroup>
          <MenuLabel>Color style</MenuLabel>
          <MenuRadioGroup value={theme.colorStyle()} onChange={(v) => theme.setColorStyle(v as ColorStyle)}>
            <For each={STYLES}>
              {(s) => (
                <MenuRadioItem value={s.value} icon={s.icon}>
                  {s.label}
                </MenuRadioItem>
              )}
            </For>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuDivider />
        <MenuGroup>
          <MenuLabel>Text size</MenuLabel>
          <MenuRadioGroup value={theme.textSize()} onChange={(v) => theme.setTextSize(v as TextSize)}>
            <For each={TEXT_SIZES}>{(s) => <MenuRadioItem value={s.value}>{s.label}</MenuRadioItem>}</For>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuDivider />
        <div class="flex items-center gap-3 px-3 py-2 text-body-small text-on-surface-variant">
          <span
            class="size-6 shrink-0 rounded-full border border-outline-variant"
            style={{ "background-color": theme.seed() }}
          />
          <span>
            {theme.systemAccent()
              ? `Colors from your system accent (${theme.seed()})`
              : "No system accent found. Using the Material default."}
          </span>
        </div>
      </MenuContent>
    </Menu>
  );
}
