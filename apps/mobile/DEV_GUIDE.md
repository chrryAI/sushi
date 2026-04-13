# Capacitor Mobile Development Guide

## 🔥 Hot Module Replacement (HMR)

**Run with live reload:**

```bash
cd apps/mobile

# Terminal 1: Start Vite dev server
pnpm dev

# Terminal 2: Run iOS with live reload
CAPACITOR_SERVER_URL=http://localhost:5175 pnpm exec cap run ios
```

Or use the shortcut:

```bash
pnpm dev:ios
```

Now any changes to `src/App.tsx` will instantly reload in the simulator!

---

## 🐛 Safari DevTools (Console & Debugger)

**Enable Web Inspector:**

1. **On Mac:** Open **Safari** → **Develop** menu
2. **Find your simulator:** `Develop` → `Simulator - iPhone 16 Pro` → `localhost`
3. **Open Web Inspector** - You'll see:
   - **Console** tab (for `console.log`)
   - **Debugger** tab (set breakpoints)
   - **Network** tab (API calls)
   - **Elements** tab (inspect DOM)

**Enable Develop Menu (if hidden):**

- Safari → **Settings** → **Advanced** → ✅ **Show Develop menu in menu bar**

---

## 📱 Native Debugging (Xcode Console)

For native iOS logs:

1. In Xcode, open **View** → **Debug Area** → **Show Debug Area** (Cmd+Shift+Y)
2. You'll see native Swift/Objective-C logs here

---

## 🎯 Best Workflow

**Development:**

```bash
# Keep this running in one terminal
pnpm dev

# Run iOS (connects to dev server automatically)
pnpm dev:ios
```

**Production Build:**

```bash
pnpm build
pnpm exec cap sync ios
# Then run from Xcode
```

---

## 🔍 Debugging Tips

**Console.log in React:**

```tsx
console.log("Debug:", someVariable);
// Shows in Safari Web Inspector Console
```

**Network Requests:**

- Safari Web Inspector → **Network** tab
- See all API calls to your backend

**React DevTools:**

- Install React DevTools Safari Extension
- Inspect component state/props

**Breakpoints:**

- Safari Web Inspector → **Debugger** tab
- Set breakpoints in your TypeScript code
- Step through execution
