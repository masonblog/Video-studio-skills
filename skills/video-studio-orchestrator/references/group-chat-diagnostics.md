# Group Chat "Not in Room" — Diagnostic Checklist

Use this when any video-* profile shows "not in room" in Hermes Studio group chat even though its systemd gateway service is running.

## TL;DR: The Fix

After verifying prerequisites below, the last step is always a **Web UI operation**: open Hermes Studio → group chat room → add each profile as an agent with names matching `video-director`, `video-researcher`, etc.

## Diagnostic Commands

### 1. Gateway service status (all profiles)

```bash
for p in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  echo "=== $p ===" && hermes --profile "$p" gateway status; echo
done
```

Expected: all `active (running)`, all show `✓ User gateway service is running`.

### 2. Platform state check

```bash
for p in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  echo "=== $p ==="
  python3 -c "import json; d=json.load(open(f'{HERMES_HOME}/profiles/$p/gateway_state.json')); [print(f'  {k}: {v[\"state\"]}') for k,v in d.get('platforms',{}).items()]"
done
```

Expected for group chat to work:
- `api_server: connected` ✅
- `telegram: fatal` or `telegram: disconnected` — acceptable (not needed for group chat)

If `api_server` is NOT `connected`, the gateway is not ready for Web UI group chat.

### 3. Verify API server ports

```bash
ss -tlnp | grep hermes | grep -E "865[0-6]"
```

Expected: one listening port per profile (8650-8656). Note which PID → port mapping.

### 4. .env configuration check

```bash
for p in video-director video-researcher video-writer video-editor video-narrator video-renderer video-packager; do
  env_file="{HERMES_HOME}/profiles/$p/.env"
  allow=$(grep "^GATEWAY_ALLOW_ALL_USERS=" "$env_file" 2>/dev/null || echo "MISSING")
  token=$(grep "^TELEGRAM_BOT_TOKEN=" "$env_file" 2>/dev/null || echo "NOT SET (good)")
  symlink=$(test -L "$env_file" && echo "SYMLINK (bad)" || echo "file (good)")
  echo "$p: GATEWAY_ALLOW_ALL_USERS=$allow | TELEGRAM=$token | type=$symlink"
done
```

Requirements:
- `GATEWAY_ALLOW_ALL_USERS=true` ✅
- `TELEGRAM_BOT_TOKEN` commented out or absent ✅
- `.env` is a regular file (NOT a symlink) ✅

### 5. HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH

```bash
grep "HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH" /etc/systemd/system/hermes-web-ui.service
```

Expected: `HERMES_GROUP_CHAT_MAX_AGENT_MENTION_DEPTH=8` (or higher for longer chains).

### 6. Web UI group chat room membership

This is the final check — profiles need to be added as agents in the Web UI room. There is no CLI command for this; it must be done through Hermes Studio UI:

1. Open Hermes Studio (http://127.0.0.1:8648 or hermes-studio.ai)
2. Enter the group chat room
3. Add agents with these exact names:
   - `video-director`
   - `video-researcher`
   - `video-writer`
   - `video-editor`
   - `video-narrator`
   - `video-renderer`
   - `video-packager`

## Common Failure Patterns

| Symptom | Likely Cause | Check |
|---------|-------------|-------|
| `api_server` not in gateway_state | Gateway started without API server | `.env` missing `GATEWAY_ALLOW_ALL_USERS=true` |
| Telegram `fatal` on all profiles | Expected — all share same bot token, group chat uses API server | Ignore; this is normal |
| Gateway restart loop (counter ≥ 4) | Telegram conflict or env issue | Check journalctl logs for the specific profile |
| Profile not in room despite all checks green | Hasn't been added to the Web UI room | **The fix**: add the profile as an agent in Hermes Studio room UI |
| "Not in room" on one profile only | That profile's gateway may have disconnected from Socket.IO | Restart: `systemctl --user restart hermes-gateway-<profile>` |

## Deleting a Profile

If a profile is no longer needed (e.g., `video-producer` was removed):

```bash
# 1. Kill the gateway process
kill $(cat {HERMES_HOME}/profiles/<name>/gateway.pid 2>/dev/null) 2>/dev/null

# 2. Remove the profile directory
rm -rf {HERMES_HOME}/profiles/<name>/

# 3. Check for residual systemd service
ls {HOME}/.config/systemd/user/hermes-gateway-<name>* 2>/dev/null
# If found: systemctl --user disable --now hermes-gateway-<name>
```
