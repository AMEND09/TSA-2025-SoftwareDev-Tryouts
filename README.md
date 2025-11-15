# Time Tracking System - TSA Software Development Submission

An accessible, WCAG 2.1 AA compliant time tracking system with Web Speech API integration and PocketBase backend.

## Live Software Link

**Hosted Application:** https://amend09.github.io/TSA-2025-SoftwareDev-Tryouts/public/

**Backend API:** https://tryout-backend.rizzed.mom

> **Note:** The PocketBase backend is already configured. You can view the admin panel at https://tryout-backend.rizzed.mom/_/ using:
> - Email: `adityam3ndiratta@gmail.com`
> - Password: `tsa_tryouts`

---

## Installation Instructions

### Option 1: Use the Live Version (Recommended)

Simply visit **https://amend09.github.io/TSA-2025-SoftwareDev-Tryouts/public/** in your browser!

No installation required - the app is fully hosted on GitHub Pages.

### Option 2: Run Locally

#### Prerequisites
- **Web Browser** (Chrome, Edge, Firefox, or Safari)
- **Git** (optional, for cloning)

#### Step 1: Download the Project

```powershell
# Option A: Clone with Git
git clone https://github.com/AMEND09/TSA-2025-SoftwareDev-Tryouts.git
cd TSA-2025-SoftwareDev-Tryouts

# Option B: Download ZIP from GitHub and extract
```

#### Step 2: Open the Application

**Method A - Direct File Opening:**
```powershell
# Navigate to the public folder and open index.html
cd public
start index.html
```

**Method B - Python HTTP Server (if Python is installed):**
```powershell
cd public
python -m http.server 3000
# Then open http://localhost:3000 in your browser
```

**Method C - VS Code Live Server Extension:**
1. Install "Live Server" extension in VS Code
2. Right-click `public/index.html`
3. Select "Open with Live Server"

### PocketBase Backend (Already Configured)

The PocketBase backend is already set up and running at https://tryout-backend.rizzed.mom with all required collections:
- `time_entries` - Time clock records
- `edit_requests` - Time entry correction requests  
- `time_off_requests` - PTO/time-off requests
- `user_profiles` - User balances and settings

No backend setup required! Just register a new account and start using the app
---

## Reasoning Behind Delivery Method (150 words)

This time tracking system is delivered as a **static web application hosted on GitHub Pages with PocketBase backend** for several strategic reasons. First, **static site delivery ensures zero-cost hosting** with global CDN distribution through GitHub Pages, making it instantly accessible worldwide. Second, **web-based delivery ensures universal accessibility** across all devices and operating systems without requiring separate native apps for Windows, macOS, iOS, or Android. Third, **PocketBase provides a lightweight, real-time backend** that is easy to deploy and maintain while offering enterprise-grade features like authentication, relational data, and API rules. Fourth, **separation of frontend and backend** allows independent scaling and updates - the frontend can be hosted on any static server while the backend handles complex data operations. Finally, this architecture supports **WCAG 2.1 AA compliance** through pure HTML/CSS/JavaScript, ensuring compatibility with assistive technologies like screen readers while leveraging modern Web Speech API for built-in voice output.

---

## Essential Information (150 words)

**Security & Privacy:** All user data is stored securely in PocketBase with password hashing and session management. Passwords must be at least 8 characters. Each user can only access their own time entries and cannot view other users' data.

**Browser Compatibility:** The application works best in modern browsers (Chrome, Edge, Firefox, Safari). Web Speech API requires Chrome 33+, Edge 14+, Firefox 49+, or Safari 14.1+. Internet Explorer is not supported.

**Data Retention:** Time entries are stored indefinitely until manually deleted by administrators. Users can export their timesheet data as needed.

**Manager Features:** The current implementation focuses on employee time tracking. Manager approval workflows for edit requests and time-off requests require additional PocketBase rules and UI components (documented but not fully implemented).

**Offline Support:** The application requires an internet connection to sync with PocketBase. Local storage is used only for accessibility preferences.

---

## Sources and Citations

### Design Resources

1. **Accessibility Guidelines:**  
   Web Content Accessibility Guidelines (WCAG) 2.1. *World Wide Web Consortium (W3C)*. 5 June 2018. Web. 14 Nov. 2025. <https://www.w3.org/WAI/WCAG21/quickref/>

2. **Color Palette Generator:**  
   Coolors - The super fast color palettes generator. *Coolors.co*. Web. 14 Nov. 2025. <https://coolors.co/>

3. **Icon - Accessibility Symbol:**  
   "Universal Access Symbol (♿)." *Unicode Consortium*. Unicode Standard Version 15.0. Web. 14 Nov. 2025.

4. **Favicon - Clock Emoji:**  
   "Alarm Clock Emoji (⏰)." *Unicode Consortium*. Unicode Standard Version 6.0. Web. 14 Nov. 2025.

### Technical Documentation

5. **Web Speech API Documentation:**  
   "Web Speech API." *MDN Web Docs*. Mozilla Developer Network. 2025. Web. 14 Nov. 2025. <https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API>

6. **ARIA Practices Guide:**  
   "ARIA Authoring Practices Guide (APG)." *W3C*. World Wide Web Consortium. 2024. Web. 14 Nov. 2025. <https://www.w3.org/WAI/ARIA/apg/>

7. **PocketBase Documentation:**  
   "PocketBase - Open Source backend in 1 file." *PocketBase*. 2025. Web. 14 Nov. 2025. <https://pocketbase.io/docs/>

8. **GitHub Pages Documentation:**  
   "GitHub Pages | Websites for you and your projects." *GitHub Docs*. GitHub, Inc. 2025. Web. 14 Nov. 2025. <https://pages.github.com/>

### Research & Best Practices

9. **Screen Reader User Survey:**  
   WebAIM. "Screen Reader User Survey #10 Results." *WebAIM*. May 2024. Web. 14 Nov. 2025. <https://webaim.org/projects/screenreadersurvey10/>

10. **Inclusive Design Principles:**  
    "Inclusive Design Principles." *Inclusive Design Principles*. Paciello Group. Web. 14 Nov. 2025. <https://inclusivedesignprinciples.org/>

11. **Keyboard Navigation Patterns:**  
    "Keyboard Interaction Models." *Deque University*. Deque Systems. Web. 14 Nov. 2025. <https://dequeuniversity.com/library/>

12. **Focus Management Best Practices:**  
    Dodson, Rob. "Focus Management in Complex Widgets." *Web Fundamentals*. Google Developers. 2023. Web. 14 Nov. 2025.

### Fonts & Typography

13. **System Font Stack:**  
    "System Font Stack - CSS Tricks." *CSS-Tricks*. Chris Coyier. 2023. Web. 14 Nov. 2025. <https://css-tricks.com/snippets/css/system-font-stack/>

14. **Roboto Font (referenced but blocked):**  
    "Roboto." *Google Fonts*. Google. Web. 14 Nov. 2025. <https://fonts.google.com/specimen/Roboto>

### Code Libraries & Frameworks

15. **PocketBase JavaScript SDK:**  
    "PocketBase JavaScript SDK." *npm*. npm, Inc. 2025. Web. 14 Nov. 2025. <https://www.npmjs.com/package/pocketbase>

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** PocketBase (hosted at tryout-backend.rizzed.mom)
- **Hosting:** GitHub Pages (static site deployment)
- **APIs:** Web Speech API, PocketBase REST API
- **Accessibility:** WCAG 2.1 AA, ARIA 1.2, Web Speech API
- **Storage:** PocketBase database, localStorage (preferences only), sessionStorage (screen reader state)

---
