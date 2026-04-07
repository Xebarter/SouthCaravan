# Accessibility Guidelines - SouthCaravan Platform

SouthCaravan is built with accessibility as a core principle, following WCAG 2.1 AA standards.

## Keyboard Navigation

- All interactive elements are reachable via keyboard (Tab key)
- Logical tab order follows visual flow (left to right, top to bottom)
- Skip links provided for main content areas
- Focus indicators are clearly visible
- No keyboard traps present

**Test**: Press Tab to navigate through the entire application without using a mouse.

## Screen Reader Support

- Semantic HTML used throughout (header, nav, main, footer, section, article)
- ARIA labels provided for icon-only buttons
- Form labels properly associated with inputs
- List structures properly marked
- Dynamic content updates announced to screen readers
- Image alt text describes purpose and content

**Test**: Navigate using:
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (macOS, free)
- TalkBack (Android, free)

## Color & Contrast

- All text has minimum 4.5:1 contrast ratio (normal text)
- All UI components have minimum 3:1 contrast ratio
- Color is not sole means of conveying information
- Focus indicators are visible and high contrast

**Design Tokens Used**:
- Foreground: oklch(0.95 0 0)
- Background: oklch(0.09 0 0)
- Primary: oklch(0.62 0.22 263) with white text
- All meeting AA compliance

**Test**: Use WebAIM contrast checker at webaim.org/resources/contrastchecker/

## Forms & Inputs

- All form fields have associated labels
- Error messages linked to form fields
- Required fields clearly marked
- Instructions provided before form
- Success/error feedback clear and accessible

**Pattern**:
```tsx
<Label htmlFor="email">Email Address *</Label>
<Input
  id="email"
  type="email"
  required
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-email" : undefined}
/>
{hasError && <p id="error-email" className="text-destructive">{error}</p>}
```

## Navigation & Wayfinding

- Main navigation clearly labeled and structured
- Breadcrumbs help users understand location
- Links have descriptive text (not "click here")
- Current page highlighted in navigation
- Mobile navigation follows best practices

**Elements Used**:
- `<Breadcrumbs>` component with proper semantics
- Skip to main content links
- Clear section headings

## Mobile & Touch

- Touch targets minimum 44x44 pixels
- Adequate spacing between interactive elements
- Responsive text sizing (no text smaller than 12px)
- Zoom up to 200% supported
- Works with both portrait and landscape orientations

## Motion & Animation

- No animations that last longer than 5 seconds
- No flashing/flickering content (avoid 3+ times per second)
- Option to reduce motion respected (prefers-reduced-motion)
- Animations enhance, not required for functionality

**CSS Pattern**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Images & Media

- All images have descriptive alt text
- Decorative images have empty alt="" attributes
- SVG icons use aria-label or aria-hidden
- Video content has captions
- Audio content has transcripts

**Pattern**:
```tsx
<img src="product.jpg" alt="Industrial Component A - High-grade steel part" />
<Button aria-label="Add to cart"><ShoppingCart /></Button>
```

## Text & Language

- Headings properly structured (h1, h2, h3 in order)
- Text uses plain language
- Abbreviations expanded on first use
- Lists properly marked with ul/ol/li
- Line length typically max 80 characters
- Line height at least 1.5

## Data Tables

- Header row properly marked with `<th>`
- Table headers associated with data cells
- Scope attributes used on headers
- Complex tables have summary

**Pattern**:
```tsx
<table>
  <thead>
    <tr>
      <th scope="col">Product Name</th>
      <th scope="col">Price</th>
    </tr>
  </thead>
  <tbody>
    {/* data rows */}
  </tbody>
</table>
```

## Dynamic Content & AJAX

- Loading states announced to screen readers
- New content additions announced
- Error messages clearly associated with cause
- Form validation errors linked to fields
- Status updates use aria-live regions

**Pattern**:
```tsx
<div aria-live="polite" aria-atomic="true">
  {loading && "Loading orders..."}
  {error && <AlertCircle /> Error message}
</div>
```

## Component Patterns

### Buttons
```tsx
<Button aria-label="Close menu">
  <X className="w-5 h-5" />
</Button>
```

### Tabs
```tsx
<Tabs defaultValue="details" role="tablist">
  <TabsTrigger value="details" role="tab">
    Details
  </TabsTrigger>
  <TabsContent value="details" role="tabpanel">
    Content
  </TabsContent>
</Tabs>
```

### Modals
```tsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Action</h2>
  {content}
</div>
```

## Testing Checklist

### Automated Testing
- [ ] Lighthouse accessibility score 90+
- [ ] axe DevTools scan passes
- [ ] WebAIM contrast checker passes
- [ ] WAVE browser extension shows no errors

### Manual Testing
- [ ] Tab through entire site without mouse
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Test with keyboard only
- [ ] Test with browser zoom at 200%
- [ ] Test on mobile device
- [ ] Test color blindness simulators

### Tools
- Lighthouse (Chrome DevTools)
- axe DevTools (axe.deque.com)
- WebAIM Contrast Checker (webaim.org)
- WAVE (wave.webaim.org)
- NVDA Screen Reader (nvaccess.org)
- Color Oracle (colororacle.org)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All mobile browsers

## Common Issues & Fixes

### Issue: Invisible focus indicators
**Fix**: Ensure `:focus-visible` styles are present and visible

### Issue: Images missing alt text
**Fix**: Add descriptive alt attribute to all `<img>` elements

### Issue: Color-only information
**Fix**: Combine color with text labels or icons

### Issue: Not keyboard accessible
**Fix**: Use semantic HTML and add keyboard event handlers

### Issue: Screen reader announces "image" repeatedly
**Fix**: Use proper heading hierarchy and semantic structure

## Continuous Improvement

- Monthly accessibility audits
- User testing with assistive technologies
- Quarterly WCAG compliance review
- Accessibility issue tracking in bug backlog
- Team training on accessible development

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Blog](https://webaim.org/blog/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Support

For accessibility issues or feedback:
- Email: accessibility@southcaravan.com
- Report issue: [Add GitHub issue link]

---

**Last Updated**: March 2026  
**Compliance Level**: WCAG 2.1 AA
