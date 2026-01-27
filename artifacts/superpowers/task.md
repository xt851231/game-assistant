# Task Checklist: 16:9 Video Layout

- [ ] **Analysis**
    - [ ] Determine CSS strategy for aspect-ratio driven width (e.g., `aspect-ratio` property, `max-width`, `flex-grow`).
    - [ ] Calculate breakpoints or constraints to ensure chat area doesn't get too small.
- [ ] **Implementation**
    - [ ] Modify `LiveAPIDemo.css`:
        - [ ] Apply `aspect-ratio: 16/9` to `.video-container` or a wrapper.
        - [ ] Set `.video-container` not to grow beyond its ratio.
        - [ ] Set `.chat-interface` to `flex: 1` to take remaining space.
        - [ ] Ensure centering logic works when video is narrower than available space.
- [ ] **Verification**
    - [ ] Verify 16:9 ratio is maintained on different window sizes.
    - [ ] Verify chat area fills the rest.
    - [ ] Check if chat area becomes too narrow and add a `min-width` if needed.
