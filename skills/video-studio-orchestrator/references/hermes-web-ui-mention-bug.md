# Group Chat Agent-to-Agent Mention Bug (hermes-web-ui ≤ 0.6.10)

## Summary

Agent-to-agent @mention dispatching in Hermes Studio group chat is broken in hermes-web-ui 0.6.10. When one agent (e.g., `video-director`) sends a message containing `@video-researcher`, the `processMentions` function in the group chat server never dispatches to the mentioned agent, even though all conditions for dispatch are met.

## Evidence

### What works
- User → agent mentions: when a human user types `@video-director`, the director is correctly dispatched
- All 7 video profile gateways running with API servers on ports 8650-8656
- All agents in the same group chat room (`mq0fbc1r1x6u65: "Nvdia 简史"`)
- Director's message with `@video-researcher` saved to `gc_messages` table
- `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8` set in node process environment
- Video-researcher API server responds to direct HTTP requests

### What fails
- `processMentions` never triggers when Director sends `@video-researcher`
- No bridge log entries for video-researcher (only for video-director and default)
- No error messages in server log
- No researcher messages appear in the database

### Analysis

The `handleMessage` function in the group chat server (`rh` class) should call `processMentions` when:
1. `t.role === "assistant"` ✅ (Director is an agent)
2. `W?.source === "agent"` ✅ (member registered with source "agent")
3. `Y < cHI()` ✅ (`Y = 1`, `cHI() = 8`)

All conditions are met, yet dispatch does not occur. The `kz` function correctly extracts `@video-researcher` from message content and matches it to registered room agents.

### Investigation path

1. Director SOUL.md configured for group chat @mention handoff → researcher unresponsive
2. Gateway crash: multi-profile Telegram token conflict → fixed by removing `TELEGRAM_BOT_TOKEN`
3. `gateway.skip_platforms` discovery: phantom config key that doesn't exist in Hermes codebase
4. API Server not enabled: added `API_SERVER_ENABLED=true` + `API_SERVER_KEY` + unique ports
5. Skill not synced: copied `video-studio-orchestrator` to profile skills directories
6. All gateways running, API servers responding, but @mention dispatch still fails
7. Code analysis of minified `hermes-web-ui/dist/server/index.js`: `handleMessage` → `processMentions` chain appears correct
8. Database inspection: messages saved, agents in room, but no dispatch side effects
9. Bridge log: only `video-director` and `default` have bridge requests
10. Conclusion: bug in hermes-web-ui 0.6.10's `processMentions` dispatch
