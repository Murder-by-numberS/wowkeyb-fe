# Idle Timeout Service Setup

This service handles automatic token refresh and idle user logout.

## Features

1. **Activity Monitoring** - Tracks clicks, keyboard, scroll, and mouse movement
2. **Auto Token Refresh** - Refreshes token when user is active and token expires in < 5 minutes
3. **Idle Warning** - Warns user 3 minutes before auto-logout (after 27 min of inactivity)
4. **Graceful Logout** - Logs out after 30 minutes of complete inactivity

## How It Works

```
User Activity → Reset Idle Timer
                ↓
After 27 min idle → Show Warning (stay logged in?)
                    ↓
After 30 min idle → Auto Logout
                    
Also:
Token expires in <5 min + User Active → Auto Refresh Token
```

## Integration Steps

### 1. Start watching on user login

In your **sign-in component** or **auth guard**, add:

```typescript
// src/app/modules/auth/sign-in/sign-in.component.ts
import { IdleTimeoutService } from 'app/core/services/idle-timeout.service';

constructor(
    private idleTimeoutService: IdleTimeoutService,
    // ... other services
) {}

signIn() {
    this.authService.signIn(credentials).subscribe({
        next: (response) => {
            // Start watching for idle users
            this.idleTimeoutService.startWatching();
            
            // ... rest of your login logic
        }
    });
}
```

### 2. Stop watching on logout

In your **sign-out component**:

```typescript
// src/app/modules/auth/sign-out/sign-out.component.ts
import { IdleTimeoutService } from 'app/core/services/idle-timeout.service';

constructor(
    private idleTimeoutService: IdleTimeoutService,
    // ... other services
) {}

ngOnInit() {
    // Stop watching
    this.idleTimeoutService.stopWatching();
    
    // ... rest of your logout logic
}
```

### 3. Initialize on app start (for already logged-in users)

In your **app.component.ts**:

```typescript
// src/app/app.component.ts
import { IdleTimeoutService } from 'app/core/services/idle-timeout.service';
import { AuthService } from 'app/core/auth/auth.service';

constructor(
    private authService: AuthService,
    private idleTimeoutService: IdleTimeoutService
) {}

ngOnInit() {
    // If user is already logged in, start watching
    this.authService.check().subscribe(authenticated => {
        if (authenticated) {
            this.idleTimeoutService.startWatching();
        }
    });
}
```

## Configuration

Edit timeouts in **idle-timeout.service.ts**:

```typescript
private readonly IDLE_TIMEOUT = 30;          // Minutes until auto-logout
private readonly WARNING_BEFORE = 3;          // Minutes before timeout to warn
private readonly TOKEN_REFRESH_THRESHOLD = 5; // Refresh if token expires in X min
```

## Backend Requirements

Make sure your backend `/auth/refresh-access-token` endpoint:
1. Accepts `{ token: string }` in request body
2. Returns `{ token: string, user?: any }` with new token

## Improvement Ideas

1. Replace `confirm()` dialog with custom Material Dialog
2. Add countdown timer in warning dialog
3. Store idle preferences per user
4. Add "Remember Me" option for longer sessions
5. Track session duration analytics

## Testing

1. Log in and wait 27 minutes → Should see warning
2. Be active → Token should auto-refresh before expiration
3. Ignore warning → Should log out after 30 minutes total
4. Click "Stay Logged In" → Should reset timer

