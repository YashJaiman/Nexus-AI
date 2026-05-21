# Assets Folder

This folder is for storing static assets like images, icons, and other media files.

## Structure

- `images/` - For image files (PNG, JPG, SVG, etc.)
- `icons/` - For icon files
- `fonts/` - For custom font files (if needed)

## Usage

Import assets in your components:

```jsx
import logo from '../assets/images/logo.png'

<img src={logo} alt="Logo" />
```

Or use as CSS background:

```css
background-image: url('../assets/images/background.png');
```

## Current Status

This folder is ready for your custom assets. Google Fonts is already integrated in the global CSS for typography.
