# Time Tracking System - TSA Software Development Submission

An accessible, WCAG 2.1 AA compliant time tracking system with Web Speech API integration and PocketBase backend.

## Live Software Link

**Hosted Application:** 

**Backend API:** https://tryout-backend.rizzed.mom
*NOTE: If you're interested in seeing the backend, the superuser email is: ```adityam3ndiratta@gmail.com``` and the password is: ```tsa_tryouts```

---

## Installation Instructions

### Prerequisites
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Web Browser** (Chrome, Edge, Firefox, or Safari)
- **PocketBase Account** (backend provided at tryout-backend.rizzed.mom)

### Step 1: Clone or Download the Project

```powershell
# If using Git
git clone https://github.com/AMEND09/TSA-2025-SoftwareDev-Tryouts.git
cd TSA-2025-SoftwareDev-Tryouts

```

### Step 2: Install Dependencies

```powershell
npm install
```

This installs the required Node.js packages listed in `package.json`.

### Step 3: Configure PocketBase Backend

The application requires PocketBase collections to be set up manually:

1. **Open PocketBase Admin Dashboard:**  
   Navigate to https://tryout-backend.rizzed.mom/_/

2. **Login with Admin Credentials:**
   - Email: `adityam3ndiratta@gmail.com`
   - Password: `tsa_tryouts`

3. **Create Required Collections:**  
   Follow the detailed instructions in **POCKETBASE_SETUP.md** to create:
   - `time_entries` - Time clock records
   - `edit_requests` - Time entry correction requests
   - `time_off_requests` - PTO/time-off requests
   - `user_profiles` - User balances and accessibility settings

4. **Set API Rules:**  
   Each collection needs specific API rules to allow authenticated users to access their own data. 

### Step 4: Start the Development Server

```powershell
npm start
```

The server will start on **http://localhost:3000**
---

## Reasoning Behind Delivery Method (150 words)

This time tracking system is delivered as a **Node.js web application with PocketBase backend** for several strategic reasons. First, **web-based delivery ensures universal accessibility** across all devices and operating systems without requiring separate native apps for Windows, macOS, iOS, or Android. Second, **PocketBase provides a lightweight, real-time backend** that is easy to deploy and maintain while offering enterprise-grade features like authentication, relational data, and API rules. Third, **separation of frontend and backend** allows independent scaling and updates - the frontend can be hosted on any static server while the backend handles complex data operations. Fourth, **progressive web app principles** enable offline functionality and app-like experiences without app store restrictions. Finally, this architecture supports **WCAG 2.1 AA compliance** through pure HTML/CSS/JavaScript, ensuring compatibility with assistive technologies like screen readers while leveraging modern Web Speech API for built-in voice output.

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

8. **Node.js HTTP Server Module:**  
   "HTTP | Node.js Documentation." *Node.js Foundation*. 2025. Web. 14 Nov. 2025. <https://nodejs.org/api/http.html>

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

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** PocketBase (hosted at tryout-backend.rizzed.mom)
- **Server:** Node.js HTTP module
- **APIs:** Web Speech API, PocketBase REST API
- **Accessibility:** WCAG 2.1 AA, ARIA 1.2, Web Speech API
- **Storage:** PocketBase database, localStorage (preferences only), sessionStorage (screen reader state)

---
