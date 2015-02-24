# Change Log

## [Unreleased]
### Added
- Mark incognito windows when exporting tabs
- German and Spanish locales
- Improve tab counter responsiveness
- Improve the accuracy of the link text when copying from the context menu
- Use the naked domain name when not entering a title for a link before copying
- Add keyboard shortcuts to the action's title attributes

### Fixed
- When opening only windows (no tabs), don't restore focus to the original window
- Don't close the openerTab if it is from an incognito window
- Don't offer to send incognito tabs to non-incognito windows and vice versa
- Restore toast functionality

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