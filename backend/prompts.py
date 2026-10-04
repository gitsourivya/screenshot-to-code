SCREENSHOT_TO_CODE_PROMPT = """
You are an expert frontend developer.

Analyze the provided website screenshot carefully.

Recreate the website as accurately as possible using:

1. HTML
2. CSS

Match:
- Layout
- Spacing
- Colors
- Typography
- Buttons
- Navigation
- Cards
- Borders
- Border radius
- Shadows
- Alignment

Requirements:
- Use semantic HTML
- Use clean CSS
- Make it responsive
- Do not use Bootstrap or Tailwind
- Do not explain the code

Return the result exactly in this format:

---HTML---
[complete HTML code]

---CSS---
[complete CSS code]
"""