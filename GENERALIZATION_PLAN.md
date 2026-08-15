# Project Generalization & Optimization Plan

## 1. The Core Issue
Currently, the codebase duplicates a massive amount of functionality across multiple frontend components (`Gallery.jsx`, `Moments.jsx`, `Events.jsx`, `Story.jsx`). 
- **Naming Inconsistencies:** The API uses a generic `/:key` structure format, but the frontend maintains rigidly separate states (`events`, `galleryPhotos`, `momentsPhotos`, `stories`) and varying names.
- **Redundant Code:** Upload logic, image compression, admin checks, Framer Motion animations, Lightboxes, and API calls are duplicated in every single file.
- **Maintenance Nightmare:** Changing an animation, a layout setting, or fixing a bug in image uploads requires modifying 4+ separate files.

## 2. The Generalization Strategy ("Single Source of Truth")

To fix this and drastically shrink the codebase without breaking the existing UI, we will introduce a **Generic Reusable Architecture**.

### A. The Core Wrapper: `MediaGridTemplate.jsx`
We will create a single component (`src/components/common/MediaGridTemplate.jsx`) that handles:
1. **Authentication & Admin Checks** (showing/hiding Delete/Upload buttons).
2. **File Uploading & Compression** (using `imageCompression.js`).
3. **Animations** (Framer Motion entry/exit logic).
4. **Modal/Lightbox** for viewing content.
5. **Standardized Grid Layouts** (while allowing custom injected cards so `Events` still looks like `Events`, and `Gallery` still looks like `Gallery`).

### B. Unified Context & API Calls (`ImageContext.jsx`)
Instead of:
- `addGalleryPhoto(photo)`
- `addMomentsPhoto(photo)`
- `addEvent(event)`
- `deleteGalleryPhoto(id)`
...we will generalize the React Context to provide:
- `updateContentData(collectionKey, newItem)`
- `deleteContentData(collectionKey, itemId)`
This ensures the Frontend naming exactly aligns with the Backend `/:key` logic, removing confusion.

## 3. Performance & Optimization Refactoring
- **Lazy Loading:** Ensure all dynamically rendered generic content utilizes `<img loading="lazy" />` to drastically improve Initial Page Load performance and SEO.
- **Memoization:** Wrap the generic page with `React.memo` to prevent cascading re-renders when Global Context updates unrelated items.
- **CSS Consolidation:** The generic template will rely on Tailwind's `columns-2 md:columns-3` structure centrally so CSS doesn't need to be parsed uniquely for every media page.

## 4. Execution Steps (Proceeding Now)
1. **Create `src/components/common/MediaGridTemplate.jsx`**: The foundational generalized component.
2. **Refactor `Context`**: Add generalized `modifyContent(key, action, payload)` to `ImageContext.jsx` while keeping legacy states intact briefly to ensure zero UI breakage.
3. **Migrate Views**: Swap `Gallery.jsx`, `Moments.jsx`, `Events.jsx`, and `Story.jsx` to use the new `MediaGridTemplate` under the hood. 
    - The actual UI code will just become a "Custom Card" passed into the Template, shrinking component files from ~200 lines to ~30 lines.