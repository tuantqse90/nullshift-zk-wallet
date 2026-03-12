# UI Spec — NullShift ZK Privacy Wallet

> **Version**: 0.1.0
> **Last Updated**: 2026-03-12
> **Brand Reference**: https://humorous-courage-production.up.railway.app/brand-guidelines.html

## Design Philosophy

Terminal/hacker aesthetic. Every interaction feels like you're operating a privacy tool, not a fintech app. Dark mode only. No sunshine metaphors.

## Extension Surfaces

| Surface | Size | Purpose |
|---------|------|---------|
| Popup | 360x600px | Quick actions: balance, send, receive, shield |
| Dashboard | Full tab | Advanced: note explorer, tx builder, DeFi, settings |
| Side Panel | Chrome side panel | Activity feed, proof monitor, privacy dashboard |

## Popup Screens

### 1. Lock Screen
```
┌──────────────────────────────────┐
│                                  │
│     ╔═══╗                        │
│     ║ N ║  nullshift.sh          │
│     ╚═══╝  // privacy wallet    │
│                                  │
│  ┌──────────────────────────┐    │
│  │ ········                 │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────────────────────┐    │
│  │    > Enter the void      │    │
│  └──────────────────────────┘    │
│                                  │
│  nullshift@labs$ _               │
│                                  │
└──────────────────────────────────┘
```
- Password input (monospace, dots)
- NullShift wordmark: "null" = #00ff41, "shift.sh" = #888888
- Button: `> Enter the void` (btn-primary)

### 2. Home
```
┌──────────────────────────────────┐
│  nullshift.sh     [ETH ▾] [⚙]  │
│──────────────────────────────────│
│                                  │
│  // shielded balance             │
│  ██████ ETH                      │
│  (hover to reveal)               │
│                                  │
│  // public balance               │
│  0.42 ETH                        │
│                                  │
│  Privacy: ████████░░ 78%         │
│                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Shield│ │ Send │ │ Swap │    │
│  └──────┘ └──────┘ └──────┘    │
│  ┌──────┐ ┌──────┐              │
│  │Recv  │ │Unshld│              │
│  └──────┘ └──────┘              │
│                                  │
│  // recent activity              │
│  [14:32] SHIELD 2.5 ETH    🟢   │
│  [14:30] RECV   1.0 ETH    🟢   │
│  [14:28] SEND   0.5 ETH    🟢   │
│                                  │
└──────────────────────────────────┘
```
- Shielded balance hidden by default (privacy-first)
- Privacy score: percentage of funds in shielded pool
- Quick action buttons with `>` prefix style
- Activity feed: terminal log format

### 3. Send (Shielded)
```
┌──────────────────────────────────┐
│  ← > Send Shielded               │
│──────────────────────────────────│
│                                  │
│  // recipient                    │
│  ┌──────────────────────────┐    │
│  │ 0x... or ENS             │    │
│  └──────────────────────────┘    │
│                                  │
│  // amount                       │
│  ┌──────────────────────┐ [MAX]  │
│  │ 0.0                  │ ETH    │
│  └──────────────────────┘        │
│                                  │
│  // fee estimate                 │
│  Gas:     ~0.002 ETH             │
│  Relayer: ~0.001 ETH             │
│                                  │
│  ┌──────────────────────────┐    │
│  │    > Execute Transfer    │    │
│  └──────────────────────────┘    │
│                                  │
└──────────────────────────────────┘
```

### 4. Proof Generation State
```
┌──────────────────────────────────┐
│  > Generating ZK Proof...        │
│──────────────────────────────────│
│                                  │
│  nullshift@labs$ prove           │
│                                  │
│  Circuit: shielded_transfer      │
│  Constraints: 65,536             │
│                                  │
│  [████████████░░░░░░░░] 62%     │
│                                  │
│  Elapsed: 5.2s                   │
│  Est. remaining: 3.1s            │
│                                  │
│  > Do not close this window      │
│                                  │
└──────────────────────────────────┘
```

### 5. Receive
```
┌──────────────────────────────────┐
│  ← > Receive                     │
│──────────────────────────────────│
│                                  │
│  // your shielded address        │
│                                  │
│  ┌────────────────────┐          │
│  │  ┌──────────────┐  │          │
│  │  │   QR CODE     │  │          │
│  │  │   (terminal   │  │          │
│  │  │    border)    │  │          │
│  │  └──────────────┘  │          │
│  └────────────────────┘          │
│                                  │
│  0x4a2f...8b3c                   │
│  [Copy Address]                  │
│                                  │
│  // viewing key (share to        │
│  // let others see your balance) │
│  [Show Viewing Key]              │
│                                  │
└──────────────────────────────────┘
```

## Dashboard Screens

### Portfolio Overview
- Combined shielded + public balances
- Privacy health score (large radial visualization)
- Balance trend chart (obfuscated y-axis — trend only)
- Activity feed in terminal log style

### Note Explorer
- Table styled as `ls -la` output:
```
nullshift@labs$ ls -la /notes
total 12
drw-r--r--  NOTE-001  2.500 ETH  unspent   2026-03-12 14:32
drw-r--r--  NOTE-002  1.000 ETH  unspent   2026-03-12 14:30
-rw-------  NOTE-003  0.500 ETH  spent     2026-03-12 14:28
```
- Actions: merge notes, split note
- Merkle proof status indicator

### DeFi Hub
- Anonymous swap interface
- Token pair selector
- Slippage configuration
- Relayer selection

### Settings
- Network management (RPC config, Monad)
- Key management (export viewing key, backup seed)
- Relayer preferences
- Privacy settings (auto-shield, anonymity set)
- Theme: terminal color scheme variants

## Side Panel

### Activity Feed
```
nullshift@labs$ tail -f /var/log/wallet.log

[14:32:01] SHIELD — 2.5 ETH deposited to shielded pool
[14:32:45] PROOF  — Generating transfer proof... (12s)
[14:32:57] SEND   — Shielded transfer complete ✓
[14:33:10] DAPP   — Uniswap connected (shielded mode)
[14:35:22] SWAP   — Anonymous swap: 1 ETH → 3200 USDC
```

### Proof Monitor
- Circuit name, constraint count
- Progress bar during generation
- Completion time

### Privacy Mini Dashboard
- Anonymity set size
- Shielded note count
- Recommendations

## Component Library

### Buttons
| Type | Example | Class |
|------|---------|-------|
| Primary | `> Execute` | `btn btn-primary` |
| Ghost | `> View Source` | `btn btn-ghost` |
| Danger | `> Burn Note` | `btn btn-danger` |

### Status Tags
| Status | Display | Color |
|--------|---------|-------|
| Live | `[LIVE]` | #00ff41 |
| Building | `[BUILDING]` | #ffaa00 |
| Pending | `[PENDING]` | #00ffff |
| Failed | `[FAILED]` | #ff0080 |

### Inputs
- Monospace font (JetBrains Mono)
- Dark background (#1a1a1a)
- Green border on focus (#00ff41)
- Terminal cursor style

### Animations
- Typewriter text for balance reveal
- Glitch transition on screen change
- Pulse on proof generation progress
- Respect `prefers-reduced-motion`

## Responsive Behavior
- Popup: Fixed 360x600px
- Dashboard: min-width 768px, max-width 1440px
- Side Panel: Chrome-controlled width (~400px)

## Related Docs

- [Brand Tokens](BRAND_TOKENS.md) — CSS variables and design tokens
- [Architecture](ARCHITECTURE.md) — Extension architecture
- [Dev Guide](DEV_GUIDE.md) — Building the extension
