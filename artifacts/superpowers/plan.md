## Goal
Restructure the Gaming Assistant Demo UI to group configuration settings, support multiple model configurations, and make the chat interface the primary view.

## Assumptions
- The "Step 1: Configure" and "Step 2: Choose Persona" sections in `App.jsx` are meant to be replaced by the revamped UI in `LiveAPIDemo.jsx`.
- The `gemini-api.js` adapters (Live and Flash) respect the configuration passed from `LiveAPIDemo.jsx`.
- The user wants the Chat Interface visible at all times in the main view.
- VAD settings apply to both Live (Server VAD) and Flash (Client VAD/Accumulation), so they can share a tab or be duplicated. We will group them with Behavior as requested.
- "Direct Connection" bypass proxy is now mandatory until Vertex AI adapter is ready.

## Plan
1.  **Preparation**: Create `artifacts/superpowers` directory if missing.
    - [NEW] `artifacts/superpowers/` directory. (Implicit step)
    - Verify: `ls artifacts/superpowers`

2.  **Refactor Configuration State (LiveAPIDemo.jsx)**
    - Files: `src/components/LiveAPIDemo.jsx`
    - Change:
        - Add `configTab` state ('model', 'advanced').
        - Split `apiKey` into `liveApiKey` and `flashApiKey`. Initialize from localStorage.
        - Update `connect` logic to use the correct API key based on selected `provider`.
        - Make `directConnection` default to `true` and hide the checkbox (or disable it).
    - Verify: React DevTools or `console.log` state changes.

3.  **Implement Configuration Modal UI (LiveAPIDemo.jsx)**
    - Files: `src/components/LiveAPIDemo.jsx`
    - Change:
        - Refactor the "Configuration" dropdown content to use a Tabbed interface.
        - **Tab 1: Config (Model & Connection)**:
            - Provider Select (Live/Flash).
            - API Key Input (conditional on provider).
            - Model ID Input.
            - **[Live Only]** Proactive Audio, Affective Dialog, Transcriptions toggles.
            - **[Live Only]** live api VAD Settings (Sensitivities).
            - **[Flash Only]** Basic settings (if any specific to Flash, e.g. Transcription enabled which is client-side for Flash).
            - Hide unused: Proxy URL, Project ID.
        - **Tab 2: Behavior**:
            - **Persona Selector**: Moved from `App.jsx`.
            - System Instructions.
            - Voice Selection.
            - Temperature Slider.
            **client VAD settings**
            - Silence duration
            - Prefix Padding

    - Verify: Open configuration menu, switch tabs, switch providers, see correct fields.

4.  **Move Persona Logic (App.jsx -> LiveAPIDemo.jsx)**
    - Files: `src/App.jsx`, `src/components/LiveAPIDemo.jsx`
    - Change:
        - Move `PERSONAS` constant from `App.jsx` to `LiveAPIDemo.jsx`.
        - Add logic to update `systemInstructions` and `voice` when a Persona is selected in the Config tab.
    - Verify: Selecting a persona in Config updates System Instructions and Voice.

5.  **Refactor Main Layout (App.jsx & LiveAPIDemo.jsx)**
    - Files: `src/App.jsx`, `src/components/LiveAPIDemo.jsx`, `src/components/LiveAPIDemo.css`
    - Change:
        - In `App.jsx`: Remove `onboarding-container` (Step 1, Step 2, control bar). Keep `LiveAPIDemo`.
        - In `LiveAPIDemo.jsx`:
            - Move `ChatContainer` and `ChatInput` from the "Chat" dropdown to the main component render (below toolbar).
            - **Remove duplicate controls**: Do not create a new control bar. Rely on the existing "Media" dropdown in `LiveAPIDemo` for Mic/Cam/Screen/Volume controls.
            - Ensure `videoPreview` is visible in the main layout (e.g. side-by-side with chat or overlay).
    - Verify: App loads with Chat visible. Media controls work via Media dropdown. Config menu works.

6.  **Cleanup**
    - Files: `src/components/LiveAPIDemo.css`
    - Change: Add styles for Tabs, new Layout, hidden elements.
    - Verify: UI looks clean and grouped.

## Risks & mitigations
- **Risk**: Moving Persona logic might break existing persona selection if not carefully ported.
    - **Mitigation**: Verify `PERSONAS` array structure and `handlePersonaSelect` logic are identical in new location.
- **Risk**: API Key confusion between providers.
    - **Mitigation**: Ensure `useEffect` for localStorage saves/loads distinct keys for `liveApiKey` and `flashApiKey`.
- **Risk**: Layout breakage (flexbox/grid) when moving Chat out of dropdown.
    - **Mitigation**: Use `flex: 1` on Chat container to fill remaining space in `LiveAPIDemo`.

## Rollback plan
- Revert changes to `src/App.jsx`, `src/components/LiveAPIDemo.jsx`, `src/components/LiveAPIDemo.css` using git checkout.
