# WoWKeyb Edit Mode – Action Bar Layout Design

## Overview

Edit Mode lets users design the layout of action bars and spell placement in the WoWKeyb web app. The layout is exported and applied by the WoW addon, which renders custom action bars in-game.

## Goals

1. **Layout design in browser** – Users arrange action bars (position, size, orientation) without being in WoW
2. **Spell placement** – Drag abilities from the ability list onto bar slots
3. **Key assignment** – Each slot has a key binding
4. **Addon renders layout** – WoW addon creates SecureActionButton frames based on the layout

## Data Model

### Action Bar Layout

```typescript
interface ActionBar {
  id: string;
  slots: number;           // 6 or 12
  position: BarPosition;
  orientation: 'horizontal' | 'vertical';
  scale?: number;
}

interface BarPosition {
  anchor: 'bottom' | 'top' | 'left' | 'right' | 'center';
  x: number;               // offset from anchor
  y: number;
}

interface ActionBarSlot {
  barId: string;
  slotIndex: number;
  key: string;
  spell: Spell;
}
```

### Extended Keybind (backward compatible)

```typescript
interface Keybind {
  key: string;
  spell: Spell;
  barId?: string;         // NEW – which bar
  slotIndex?: number;      // NEW – which slot
}
```

If `barId` and `slotIndex` are present, the addon uses custom layout. Otherwise, falls back to default slot mapping.

## UI Flow

### Edit Mode View

1. **Toggle Edit Mode** – Button on keybinding view: "Edit Layout"
2. **Canvas** – Simulated game screen (dark background, optional WoW frame mockup)
3. **Action Bar Palette** – "Add Bar" button, bar templates (6-slot, 12-slot)
4. **Bar List** – List of bars with position controls (x, y, anchor)
5. **Drag & Drop** – Abilities from drawer → bar slots; bars can be repositioned
6. **Key Assignment** – Click slot → assign key (or use existing key from keybinds)

### Bar Controls

- Add bar (6 or 12 slots)
- Remove bar
- Move bar (drag or x/y inputs)
- Resize (scale)
- Orientation (horizontal/vertical)

## Addon Changes

The addon would need to:

1. **Parse layout** – Read `layout.bars` and `keybinds` with `barId`/`slotIndex`
2. **Create frames** – For each bar, create a container frame
3. **Create buttons** – For each slot, create SecureActionButton with spell
4. **Position** – Use anchor/position to place bars
5. **Bind keys** – SetBindingClick(key, buttonName, "LeftButton")

## Phased Implementation

### Phase 1: Types & Design ✅
- [x] Design doc
- [x] Add layout types to frontend
- [x] Add layout fields to keybinding model (backend)

### Phase 2: Edit Mode UI ✅
- [x] Edit Mode toggle/route (Keyboard vs Action Bars)
- [x] Action bar canvas component
- [x] Add/remove bars
- [x] Position controls (anchor, x, y)
- [x] Multiple bars with default keys (1-12, Shift+1-12, Ctrl+1-12, Alt+1-12)
- [x] Save layout with keybinding
- [x] bar_id/slot_index on keybinds for layout mode

### Phase 3: Addon Layout Support ✅
- [x] Parse layout from export
- [x] Create SecureActionButton frames
- [x] Position bars from layout (scale design pixels to WoW resolution)
- [x] SetBindingClick for custom bars

### Phase 4: Polish
- [ ] Bar templates/presets
- [ ] Undo/redo
- [ ] Layout preview
