# Google OAuth state signing

The Google Calendar and Drive callbacks (`google-oauth-callback`,
`google-drive-callback`) run without a Supabase session, because Google
redirects the browser to them. They used to accept the user id as `state`
unchecked, so anyone who completed Google consent against those URLs could
replace the stored refresh token.

They now accept only a `state` signed by the server:

1. A super_admin presses **Connect Google** or **Connect Google Drive**.
2. The `integrations` Edge Function (JWT checked, super_admin only) returns a
   state through `calendar_oauth_state` or inside the `drive_auth_url` URL.
   It holds the user id, the purpose (`calendar` or `drive`), a random nonce
   and an expiry ten minutes ahead, signed with HMAC-SHA256.
3. The callback checks the signature, the expiry and the purpose, then checks
   that the user is still staff, before it exchanges the code or stores tokens.

The code lives in `supabase/functions/_shared/oauth-state.ts` and is covered by
`tests/unit/oauth-state.test.ts`.

## Secret

| Name | Where | Notes |
|---|---|---|
| `OAUTH_STATE_SECRET` | Supabase Edge Function secrets | Random, at least 32 characters. Not an Integrations page key. |

If it is missing or too short, the integrations function refuses to issue a
state and both callbacks refuse every request. Rotating it invalidates any
consent screen that is open at the time and nothing else.

## Rolling it out

Order matters, because the new client needs the new `integrations` action and
the new callbacks reject the old raw-id state.

1. Set `OAUTH_STATE_SECRET` in the project's Edge Function secrets.
2. Deploy `integrations`, then `google-oauth-callback` and
   `google-drive-callback` (both with `--no-verify-jwt`, as before).
3. Build and deploy the web app.
4. Reconnect Google Calendar and Google Drive from the settings pages, so the
   stored tokens come from a verified flow.
