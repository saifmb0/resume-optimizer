# 🤝 Contributing to AI CV & Cover Letter Generator

First off, thank you for considering contributing to this project! Every contribution helps job seekers around the world find better opportunities.

## 🌟 Ways to Contribute

### 🐛 Bug Reports
- Use GitHub Issues to report bugs
- Include steps to reproduce the issue
- Mention your browser, OS, and device type
- Screenshots are super helpful!

### ✨ Feature Requests
- Suggest new features via GitHub Issues
- Explain the use case and benefit
- Consider how it fits with the existing user experience

### 💻 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Documentation updates
- Test coverage improvements

### 🌍 Translations
We're looking for help translating the app into:
- Spanish
- French
- German
- Portuguese
- Italian
- Japanese
- And more!

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Git
- A Google Gemini API key (free tier available)

### Setup Steps

1. **Fork and clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/cvmaker.git
   cd cvmaker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your API keys:
   ```env
   GEMINI_API_KEY=your_api_key_here
   NEXT_PUBLIC_GA_ID=your_ga_id_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to http://localhost:3000

## 📝 Code Guidelines

### TypeScript
- All new code should use TypeScript
- Add proper type definitions
- Avoid `any` types when possible

### Code Style
- Follow existing formatting (Prettier handles most of this)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Component Structure
```tsx
// Good component structure
interface ComponentProps {
  // Define all props with types
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX with proper className and accessibility
  );
}
```

### Testing Requirements
- Test your changes in both light and dark modes
- Verify mobile responsiveness
- Test all form validations
- Check PDF export functionality
- Ensure accessibility (keyboard navigation, screen readers)

## 🎨 UI/UX Guidelines

### Dark Mode
- All new components must support dark mode
- Use CSS variables for colors when possible
- Test extensively in both themes

### Mobile First
- Design for mobile first, then desktop
- Use responsive Tailwind classes
- Test on various screen sizes

### Accessibility
- Add proper ARIA labels
- Ensure keyboard navigation works
- Use semantic HTML elements
- Maintain good color contrast

## 🔒 Security Considerations

- Never commit API keys or secrets
- Validate all user inputs
- Sanitize content before displaying
- Follow existing security patterns
- Report security issues privately

## 📋 Pull Request Process

### Before Submitting
1. **Test thoroughly**
   - Light and dark modes
   - Mobile and desktop
   - All form validations
   - PDF export functionality

2. **Code quality**
   - Run `npm run lint`
   - Run `npm run build`
   - Fix any TypeScript errors

3. **Documentation**
   - Update README if needed
   - Add comments for complex code
   - Update type definitions

### PR Template
When creating a PR, please include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Tested on mobile
- [ ] Tested on desktop
- [ ] Verified accessibility

## Screenshots
Include screenshots if UI changes are involved
```

## 🐛 Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Environment
- Browser: [e.g. Chrome 120]
- OS: [e.g. macOS 14.0]
- Device: [e.g. iPhone 15, Desktop]
- Dark/Light mode: [specify]

## Screenshots
If applicable
```

## 🌟 Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this work?

## Additional Context
Any other relevant information
```

## 🎉 Recognition

All contributors will be:
- Listed in our README contributors section
- Credited in release notes
- Given a shoutout on social media (if desired)

## 📞 Getting Help

- **Discord/Slack**: [Coming soon]
- **GitHub Discussions**: Use for questions and ideas
- **Issues**: For bugs and feature requests
- **Email**: [your-email] for sensitive matters

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make job searching easier for everyone! 🚀**
