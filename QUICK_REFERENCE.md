# Quick Reference Card

## 🚀 Start Development
```bash
npm run dev
```
Opens http://localhost:3000

## 📂 Folder Quick Links

| Folder | Purpose |
|--------|---------|
| `src/pages/` | Full page components |
| `src/components/` | Reusable components |
| `src/styles/` | Global CSS & variables |
| `src/assets/` | Images & icons |

## 🎨 CSS Classes

| Class | Effect |
|-------|--------|
| `.glass` | Glassmorphism card |
| `.glass-primary` | Glass with primary color |
| `.btn btn-primary` | Primary button |
| `.fade-in` | Fade animation |
| `.slide-in-left` | Slide from left |
| `.text-primary` | Cyan text |

## 🎯 CSS Variables

```css
/* Colors */
--color-primary: #00d4ff (Cyan)
--color-secondary: #a855f7 (Purple)
--color-accent: #06b6d4 (Teal)

/* Spacing */
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem

/* Font Sizes */
--font-size-base: 1rem
--font-size-lg: 1.125rem
--font-size-2xl: 1.5rem
```

## 📄 Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/login` | Login |
| `/signup` | Signup |
| `/dashboard` | Dashboard |

## 🛠 Add New Page

1. Create: `src/pages/YourPage.jsx`
2. Add import in `App.jsx`:
```jsx
import YourPage from './pages/YourPage'
```
3. Add route:
```jsx
<Route path="/yourpage" element={<YourPage />} />
```

## 🧩 Add Component

1. Create: `src/components/YourComponent.jsx`
2. Create: `src/components/YourComponent.css`
3. Export:
```jsx
export default YourComponent
```
4. Use in page:
```jsx
import YourComponent from '../components/YourComponent'
<YourComponent />
```

## 📝 Common Edits

### Change Primary Color
File: `src/styles/colors.css`
```css
--color-primary: #your-color;
```

### Update Page Title
File: `src/pages/YourPage.jsx`
```jsx
<h1>Your Title</h1>
```

### Add Navigation Link
File: `src/App.jsx`
```jsx
<Route path="/new-page" element={<NewPage />} />
```

## 🎬 Animations

| Class | Effect |
|-------|--------|
| `.fade-in` | Opacity fade |
| `.slide-in-left` | From left |
| `.slide-in-right` | From right |
| `.glow-animation` | Glow pulse |
| `.float-animation` | Float up/down |

Add delay: `style={{ animationDelay: '100ms' }}`

## 📱 Responsive Breakpoints

```css
@media (max-width: 1024px)  /* Tablets */
@media (max-width: 768px)   /* Small tablets */
@media (max-width: 480px)   /* Mobile phones */
```

## 🔌 Build & Deploy

```bash
npm run build    # Create dist/ folder
npm run preview  # Test production build
```

Deploy to: Vercel, Netlify, or GitHub Pages

## 🎨 Layout Utilities

```jsx
<div className="container">          {/* Max width wrapper */}
<div className="flex">               {/* Flex layout */}
<div className="flex-center">        {/* Centered flex */}
<div className="grid-2">             {/* 2-column grid */}
<div className="grid-3">             {/* 3-column grid */}
<div className="text-center">        {/* Centered text */}
<div className="gap-lg">             {/* Gap utility */}
```

## 📊 Component Template

```jsx
import './YourComponent.css'

function YourComponent({ prop1, prop2 }) {
  return (
    <div className="your-component glass">
      <h2>Component Title</h2>
      {/* Content */}
    </div>
  )
}

export default YourComponent
```

## 🎯 Button Variants

```jsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-danger">Danger</button>
<button className="btn btn-success">Success</button>
<button className="btn btn-outline">Outline</button>
```

## 📋 Form Elements

```jsx
<input type="text" placeholder="Enter text..." />
<input type="email" placeholder="Enter email..." />
<input type="password" placeholder="Enter password..." />
<select>
  <option>Choose option</option>
</select>
<textarea placeholder="Enter message..."></textarea>
```

## 🔍 Debugging Tips

1. **Check console**: Open DevTools (F12)
2. **Test responsive**: Use DevTools device toolbar
3. **Hard refresh**: Ctrl+Shift+R (Chrome) or Cmd+Shift+R (Mac)
4. **Check routes**: Verify path in App.jsx
5. **Inspect styles**: Right-click → Inspect Element

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Styles not updating | Hard refresh: Ctrl+Shift+R |
| Component not showing | Check import path |
| Route not working | Verify path in App.jsx |
| Emoji not showing | Browser might not support |
| Colors different | Check CSS variable values |

---

**Quick Start**: `npm run dev` → Start coding! 🚀
