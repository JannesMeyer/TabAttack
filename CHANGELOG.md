# Change Log

## [unreleased]
### Added
- Only export highlighted tabs if more than one tab is highlighted
- "Only current window" to the context menu of the toolbar icon
- Option to enable page context menu
- Search (Cmd+F) and settings (Cmd+,) to the editor

### Changed
- Set the default editor theme to KatzenMilch

## [1.6] - 24.02.2015
### Added
- Mark incognito windows when exporting tabs
- German and Spanish locales
- Improve tab counter responsiveness
- Improve the accuracy of the link text when copying from the context menu
- Use the naked domain name when not entering a title for a link before copying
- Keyboard shortcut hints to the button's tooltips
- Warn if there are no tabs to export or some tabs are still loading

### Fixed
- When opening only windows (no tabs), don't restore focus to the original window
- Don't close the openerTab if it is from an incognito window
- Don't offer to send incognito tabs to non-incognito windows and vice versa
- Restore toast functionality
- Make it possible to move tabs past pinned tabs

## [1.5] - 21.02.2015
### Added
- Option to remove the context menu item for links

### Fixed
- Three-digit tab count

## [1.4] - 21.02.2015
### Added
- Include Roboto (bold) and use it as the tab counter font
- Option page looks much better
- Ability to change the editor theme
- Use React for the options and output pages
- Autosave for options
- Add 'Copy Link as Markdown' to the context menu of links

## [1.3] - 19.02.2015
### Added
- JSON export format
- Ignore pinned tabs when exporting (can be disabled in options)
- `offline_enabled` flag in the manifest
- Good default handling for preferences

### Fixed
- Fix options saving
- Use smaller font size in icon for large tab counts (sknebel)
- Enable query to user if there are unsaved changes (sknebel)