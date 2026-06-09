# Phantom Config: gateway.skip_platforms

## Discovery

During a session debugging why 7 video-profile gateways all crash on startup, we discovered that `gateway.skip_platforms` **does not exist in the Hermes Agent codebase**. It is a phantom configuration key that was assumed to work but has no runtime effect.

## How we found out

1. All 7 video profiles had `gateway.skip_platforms: telegram` in their `config.yaml`
2. Every gateway log showed: `Connecting to telegram...` → `Telegram bot token already in use` → `Gateway exiting cleanly`
3. `grep -rn "skip_platform" ~/.hermes/hermes-agent/gateway/ --include="*.py"` returned zero matches
4. `grep -rn "skip_platform" ~/.hermes/hermes-agent/hermes_cli/ --include="*.py"` returned zero matches
5. The config key was written by `hermes config set gateway.skip_platforms telegram`, which silently succeeds (writes to YAML) but the gateway never reads it

## What actually controls platform loading

The gateway auto-discovers platforms by checking for environment variables:

```python
# gateway/config.py:1289-1292
telegram_token = os.getenv("TELEGRAM_BOT_TOKEN")
if telegram_token:
    telegram_config = _enable_from_env(Platform.TELEGRAM)
    telegram_config.token = telegram_token
```

If `TELEGRAM_BOT_TOKEN` is set AND non-empty, Telegram is enabled. There is no mechanism to skip a platform that has a valid token in the environment.

## Correct fix

Remove (or comment out) the `TELEGRAM_BOT_TOKEN` line from the profile's `.env` file:

```bash
sed -i 's/^TELEGRAM_BOT_TOKEN=/#TELEGRAM_BOT_TOKEN=/' ~/.hermes/profiles/<profile>/.env
```

For Studio group chat scenarios, this is safe because group chat uses the API Server adapter, not Telegram.

## Why this matters

Multi-profile setups where all profiles share one Telegram bot token will fail silently because:
1. The first gateway to start claims the token
2. Every subsequent gateway gets "Telegram bot token already in use"
3. The gateway treats this as a fatal startup error and exits cleanly

The only correct fix is to remove the token from profiles that don't need Telegram access.
