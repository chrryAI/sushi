# 🍣 Sushi Terminal Agent

Yukarıdan akan, chat içinde yaşayan inline terminal component'i.

## Özellikler

- **Stream Output**: Terminal output'u satır satır, real-time olarak gelir
- **Sushi Teması**: Asahi patlaması, wasabi uyarıları, sushi metaforları
- **Komut Önerileri**: Hızlı komut butonları (git status, npm install vb.)
- **Safe Area**: iOS/Android için env(safe-area-inset) desteği
- **Session Management**: Son N komutu hafızada tutar
- **Retry/Copy**: Her terminal bloğunda yeniden çalıştır & kopyala

## Kurulum

### 1. Rust Bağımlılıkları (Cargo.toml)

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
uuid = { version = "1", features = ["v4"] }
```

### 2. Tauri Komutu (lib.rs)

`execute_command` fonksiyonu eklendi. Bu fonksiyon:

- Komutu spawn eder
- stdout/stderr'yi stream eder
- Event olarak frontend'e gönderir
- İşlem bitince completion event'i gönderir

### 3. Frontend Componentleri

- `types/terminal.ts` - TypeScript tipleri
- `components/InlineTerminal.tsx` - Ana component
- `components/InlineTerminal.css` - Stiller

## Kullanım

```tsx
import { InlineTerminal } from "./components/InlineTerminal";
import "./components/InlineTerminal.css";

function App() {
  return (
    <InlineTerminal
      workingDir="."
      maxSessions={10}
      onSessionComplete={(session) => {
        console.log("Terminal session completed:", session);
      }}
    />
  );
}
```

## Sushi Şakaları

Başarılı komutlardan sonra rastgele şakalar:

- 🍙 Asahi gibi patladı!
- 🍣 Wasabi kadar sert çalıştı!
- 🥢 Chopsticks ready, iş tamam!
- 🍱 Bento box dolu, kod temiz!
- 🍜 Ramen gibi akıcı!

Hatalı komutlardan sonra:

- 😰 Oh no, soya sosu döküldü!
- 🍣 Balık taze değil gibi...
- 🥢 Chopsticks kırıldı, retry?
- 🍙 Onigiri dağıldı, rebuild?
- 🚨 Sushi master red alert!

## Mimari

```
┌─────────────────────────────────────┐
│  User Input: "npm install"          │
└──────────────┬──────────────────────┘
               │
               ▼ invoke('execute_command')
┌─────────────────────────────────────┐
│  Tauri (Rust)                       │
│  ├─ Command spawn                   │
│  ├─ stdout pipe ───────┐           │
│  ├─ stderr pipe ───────┤           │
│  └─ wait() ────────────┤           │
└──────────┬─────────────┴───────────┘
           │ emit('terminal-output')
           ▼
┌─────────────────────────────────────┐
│  React Component                    │
│  ├─ Event listener                  │
│  ├─ State güncelle                  │
│  ├─ Auto-scroll                     │
│  └─ Şaka ekle (completion)          │
└─────────────────────────────────────┘
```

## Güvenlik

- Komutlar Tauri tarafından spawn edilir (sandbox'lı değil, dikkat!)
- `shell:allow-execute` permission'u gerekebilir
- Prototip için shell scope geniş tutuldu

## Gelecek İyileştirmeler

- [ ] Terminal history (yukarı ok ile önceki komutlar)
- [ ] Tab completion
- [ ] Syntax highlighting
- [ ] Persist sessions to disk
- [ ] Split terminal (multiple panes)
- [ ] ANSI color support
