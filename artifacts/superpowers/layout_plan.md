# 16:9 Aspect Ratio Layout

The user wants the video area to strictly follow a 16:9 aspect ratio, and the chat area to fill whatever horizontal space is left.

## User Review Required
None.

## Proposed Changes

### Styles (`src/components/LiveAPIDemo.css`)
#### [MODIFY] [LiveAPIDemo.css](file:///home/xt851231/experiments/gaming-assistant-demo-app/src/components/LiveAPIDemo.css)
- **`.video-container`**:
    - remove `flex: 1` or `flex: 2`.
    - Set `aspect-ratio: 16 / 9`.
    - Set `height: 100%` (to fill vertical space).
    - Set `width: auto` (width is calculated from height * ratio).
    - Add `max-width` constraint if needed (though height limits it usually).
- **`.chat-interface`**:
    - Set `flex: 1`.
    - This will make it expand to fill all remaining width.
    - Add `min-width: 300px` to prevent it from squashing too much if the window is very narrow (scrolling or wrapping might be needed).

## Verification Plan

### Manual Verification
- Resize window horizontally.
- Verify video stays 16:9 (no black bars inside container, container *is* the 16:9 box).
- Verify chat takes all remaining space.
- Verify behavior on small screens (video shrinks, chat stays visible).
