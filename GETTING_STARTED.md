# Nexus AI - Getting Started Guide

Welcome to your Nexus AI dashboard project! This guide will help you get up and running quickly.

## 🎯 Quick Start

### 1. Start Development Server
```bash
npm run dev
```
Your app will open at `http://localhost:3000`

### 2. Explore the App
- **Home Page** (`/`) - Landing page with features
- **Login** (`/login`) - Authentication page
- **Signup** (`/signup`) - User registration
- **Dashboard** (`/dashboard`) - Main application interface

## 📚 Project Layout

```
src/
├── pages/              # Full page components
│   ├── Home.jsx       # Landing page
│   ├── Login.jsx      # Login form
│   ├── Signup.jsx     # Registration form
│   └── Dashboard.jsx  # Main dashboard
├── components/        # Reusable components
│   ├── Button.jsx    # Button component example
│   └── Card.jsx      # Card component example
├── styles/           # Global styles
│   ├── globals.css   # Main stylesheet
│   └── colors.css    # Color variables
├── assets/           # Images and icons
├── App.jsx           # Routing setup
└── main.jsx          # App entry point
```

## 🎨 Customization Tips

### Change Colors
Edit `src/styles/colors.css` to customize the color palette:
```css
:root {
  --color-primary: #00d4ff;      /* Change this */
  --color-secondary: #a855f7;    /* And this */
  /* ... more colors ... */
}
```

### Add New Pages
1. Create file: `src/pages/YourPage.jsx`
2. Add to `App.jsx`:
```jsx
import YourPage from './pages/YourPage'

<Route path="/yourpage" element={<YourPage />} />
```

### Create Components
Use the examples in `src/components/` as templates:
- Check `Button.jsx` and `Card.jsx` for component patterns
- Keep components focused and reusable

## 🚀 Building for Production

### Build Your App
```bash
npm run build
```
This creates an optimized `dist/` folder.

### Preview Build
```bash
npm run preview
```
Test your production build locally.

## 📝 Code Structure Tips

### CSS Classes
The project uses consistent naming:
```jsx
<div className="glass">              {/* Glassmorphism card */}
<div className="glass-primary">      {/* With primary color */}
<button className="btn btn-primary"> {/* Primary button */}
<div className="fade-in">            {/* Fade animation */}
```

### Color Variables
Use CSS variables for consistency:
```jsx
<div style={{ color: 'var(--color-primary)' }}>Text</div>
```

### Spacing
Use consistent spacing:
```jsx
<div style={{ padding: 'var(--spacing-lg)' }}>Content</div>
```

## 🔧 Common Tasks

### Make a Page Responsive
The CSS already includes mobile breakpoints:
```css
@media (max-width: 768px) {
  /* Tablet styles */
}

@media (max-width: 480px) {
  /* Mobile styles */
}
```

### Add Icons
Currently using emojis. For production, consider:
- React Icons: `npm install react-icons`
- Heroicons: `npm install @heroicons/react`
- Font Awesome: `npm install react-fontawesome`

### Add Form Validation
Consider these libraries:
- React Hook Form: `npm install react-hook-form`
- Formik: `npm install formik`

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is busy:
```bash
npm run dev -- --port 3001
```

### Styles Not Updating
Clear cache and restart:
```bash
npm run dev
```
Then hard-refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Import Errors
Make sure paths are correct:
```jsx
// ✅ Correct
import Home from './pages/Home'
import Button from './components/Button'

// ❌ Wrong
import Home from 'pages/Home'
```

## 📦 Dependencies

- **React 18** - UI framework
- **React Router 6** - Page routing
- **Vite** - Build tool

All dependencies are listed in `package.json`.

## 💡 Next Steps

1. **Explore the Code** - Read through components to understand the structure
2. **Customize Colors** - Make it your brand colors in `src/styles/colors.css`
3. **Add Content** - Update page content and add your own pages
4. **Build Components** - Create reusable components in `src/components/`
5. **Deploy** - Build and deploy your app

## 🌐 Deployment Options

### Vercel (Recommended for Vite)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag and drop dist/ folder to Netlify
```

### GitHub Pages
1. Add to `package.json`: `"homepage": "https://yourusername.github.io/nexus-ai"`
2. Install: `npm install --save-dev gh-pages`
3. Deploy: `npm run build`

## 📚 Learning Resources

- [React Docs](https://react.dev)
- [React Router Guide](https://reactrouter.com)
- [Vite Documentation](https://vitejs.dev)
- [CSS Variables Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

## 🎓 Best Practices

1. **Component Organization** - Keep one component per file
2. **CSS Naming** - Use consistent class names
3. **Spacing** - Always use CSS variables for spacing
4. **Colors** - Never hardcode colors; use variables
5. **Comments** - Comment complex sections
6. **Responsive** - Test on mobile, tablet, desktop

## 🤝 Support

- Read the code comments
- Check `README.md` for full documentation
- Review component examples in `src/components/`
- Explore page examples for patterns

---

Happy coding! 🚀
