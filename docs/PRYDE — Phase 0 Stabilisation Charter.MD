PRYDE — Phase 0 Stabilisation Charter
Version: 1.0

Date: 2026-01-24

Status: GOVERNANCE DOCUMENT — READ ONLY

Scope: Architectural ownership, freeze boundaries, future-facing strategy

SECTION 1 — OWNERSHIP MAPPING
1.1 Frontend Ownership Rules
Domain	Owner	Scope	Forbidden Actions
Page Layout	Page-level CSS (Feed.css, Profile.css, Settings.css, etc.)	Height, scroll behavior, viewport dimensions, flex/grid structure	—
Component Styling	Component CSS (PostHeader.css, Navbar.css, etc.)	Internal content styling, spacing, borders, typography	Declaring height: 100vh, 100dvh, 100% on containers; declaring overflow rules; declaring page-level positioning
Theme Colors	Theme CSS (quiet-mode.css, darkMode.css, purple-identity.css)	Colors, opacity, background tints, border colors	Layout rules, height declarations, overflow rules, positioning
Scroll Containers	Page-level CSS only	Exactly ONE scroll container per page	Components creating nested scroll containers (modals excluded)
Mobile Overrides	mobileFriendly.css, pwa-native-feel.css	Device-specific adjustments	Competing with page-level layout ownership
1.2 State Ownership Rules
State Domain	Authoritative Source	Secondary/Cache	Forbidden Patterns
Auth Status	AuthContext	—	Direct /auth/me calls from components
User Identity	AuthContext.user	getCurrentUser() utility	Fetching user data outside AuthContext
Access Token	In-memory (auth.js)	—	localStorage, sessionStorage
Refresh Token	httpOnly cookie	—	Request body, localStorage, JavaScript access
Auth Ready Gate	AuthContext.isAuthReady	sessionStorage.authReady (debug)	Protected actions before isAuthReady === true
Online Presence	SocketContext	useOnlineUsers hook	Direct socket queries from components
UI Flags	Local component state	—	Global state for transient UI (modals, dropdowns)
1.3 Backend Ownership Rules
Domain	Owner	Scope	Frontend Role
Auth Enforcement	Middleware (auth.js, requireActiveUser.js)	Token validation, session verification, account status	Trust backend decisions, never bypass
Permissions	Backend routes + middleware	Role checks, ownership verification, feature access	Display based on backend response, never assume
Data Sanitisation	Backend utilities + route handlers	Privacy filtering, field stripping, count hiding	Render what backend provides, never reconstruct
Error Truth	Backend response	Status codes, error codes, messages	Handle based on status + code, never infer
Rate Limiting	Backend middleware	Request throttling, abuse prevention	Respect 429, implement backoff
1.4 Ownership Boundary Violations (Current State)
Violation	Location	Ownership Conflict
Component CSS declares page layout	Messages.css lines 3540-3600	Desktop !important block overrides page-level layout files
Theme CSS declares layout	pwa-native-feel.css	Forces 100dvh heights, competing with page CSS
Theme CSS declares layout	mobileFriendly.css	Declares viewport heights and overflow rules
Multiple scroll containers	Messages page	.messages-sidebar, .chat-messages, .messages-container all have scroll
Auth state duplication	auth.js utilities	getCurrentUser() exists alongside AuthContext.user
Error handling inconsistency	Various routes	Some use errorHandler.js, some use errorResponse.js
Sanitisation duplication	posts.js, feed.js	sanitizePostForPrivateLikes() exists in both frontend and backend
Layout competition	6 CSS files	MessagesViewport.css, MessagesLayout.css, MessageThread.css, Messages.css, mobileFriendly.css, pwa-native-feel.css all target Messages layout
SECTION 2 — FREEZE & IGNORE LIST
2.1 DO NOT TOUCH (Frozen Systems)
System	Files/Modules	Rationale
Socket.IO	All socket-related code	Excluded from audit scope; complex realtime system with established patterns
Messages System	Messages.jsx, MessageThread.jsx, related routes	Excluded from audit scope; recently patched, needs stabilisation time
Notifications System	All notification routes, UI, delivery	Excluded from audit scope; tightly coupled to socket system
Token Refresh Single-Flight	tokenRefresh.js	Critical race condition prevention; any modification risks logout storms
Auth Middleware 401 Guarantee	auth.js middleware	Ensures auth failures never return 500; frontend depends on this contract
Platform Feature Flags	platformFlags.js	Immutable by design; defines what Pryde will never become
Session Cookie Security	refresh.js, cookieUtils.js	httpOnly cookie is sole refresh token source; security-critical
isAuthReady Gating	AuthContext.jsx	Gates all protected behavior; prevents race conditions on app load
CSRF Protection	csrf.js middleware	Security-critical; token rotation and enforcement
Global Error Handler	globalErrorHandler in errorHandler.js	Prevents stack trace leaks; production safety
2.2 SAFE TO IGNORE (6–12 Months)
Item	Location	Rationale
Legacy Friends System	friendsRoutes.js	Kept for backward compatibility; follow system is primary; no active harm
410 Gone Endpoints	tags.js, verification routes	Already returning deprecation response; users have migrated
User Model Verbosity	User.js (1314 lines)	Functional; refactoring risk outweighs benefit; no performance impact
CSS Architecture Overhaul	All CSS files	Requires design system investment; current state is functional with known workarounds
API Composition for Performance	Multiple endpoints per page	Performance acceptable; composition adds complexity; defer to scaling phase
Optional Chaining Overuse	Feed.jsx, Profile.jsx, etc.	Defensive coding; masks contract drift but prevents crashes; low priority
Frontend Test Coverage	src/hooks/__tests__	Only useMutation.test.js exists; adding tests is additive, not urgent
Removed Field References	Settings.jsx (relationshipStatus)	Dead code but harmless; form field simply unused
Duplicate Feed Endpoints	/posts, /feed, /feed/global	All functional; consolidation is cosmetic; no user impact
42 Mongoose Models	server/models/	Schema sprawl but each serves a purpose; no immediate consolidation needed
SECTION 3 — CSS STRATEGY (Theory)

3.1 Future-Safe CSS Layer Model

LAYER 1: Base / Reset
├── Browser normalization
├── Box-sizing rules
└── Default typography

LAYER 2: Theme
├── CSS custom properties (colors, spacing tokens)
├── Color schemes (dark mode, quiet mode)
├── Typography scales
└── FORBIDDEN: height, overflow, position, display

LAYER 3: Page Layout
├── Viewport dimensions
├── Scroll container (exactly one per page)
├── Main content area structure
├── Sidebar positioning
└── OWNS: height, overflow, position for page structure

LAYER 4: Components
├── Internal component styling
├── Component-specific spacing
├── Borders, shadows, backgrounds
└── FORBIDDEN: page-level height, overflow, position

LAYER 5: State Modifiers
├── .is-loading, .is-active, .is-disabled
├── Transition states
├── Interactive feedback
└── FORBIDDEN: layout changes (only visual feedback)

3.2 !important Usage Policy (Future State)
Allowed Use	Rationale
Documented Legacy Containment	When overriding third-party CSS or legacy code that cannot be refactored
Emergency Fixes	Temporary production hotfixes with documented removal timeline
Accessibility Overrides	User preference enforcement (high contrast, reduced motion)
Forbidden Use	Rationale
Layout Competition	Layers should not compete; if !important is needed, ownership is unclear
Component Overrides	Components should not override page layout
Theme Overrides	Themes should not override structure
3.3 Current Layer Boundary Violations
File	Declared Layer	Actual Behavior	Violation
quiet-mode.css	Theme	Declares !important on layout properties	Theme layer modifying structure
darkMode.css	Theme	Some layout overrides present	Theme layer modifying structure
purple-identity.css	Theme	Color enforcement with !important	Acceptable (color is theme domain)
mobileFriendly.css	Page Layout	Competes with page-specific CSS	Multiple files claiming page layout
pwa-native-feel.css	Page Layout	Forces viewport heights globally	Competes with page-specific CSS
Messages.css	Page Layout	Contains component-level styling	Mixed responsibilities
Feed.css	Page Layout	Contains component-level styling	Mixed responsibilities
Navbar.css	Component	Some positioning rules affect page layout	Component claiming page structure
3.4 Files Competing for Layout Ownership
Messages Page (6-way competition):

MessagesViewport.css — viewport dimensions
MessagesLayout.css — flex structure
MessageThread.css — thread layout
Messages.css — overrides with !important
mobileFriendly.css — mobile overrides
pwa-native-feel.css — PWA overrides
Feed Page (4-way competition):

Feed.css — page layout
Feed.calm.css — calm mode overrides
mobileFriendly.css — mobile overrides
pwa-native-feel.css — PWA overrides
Profile Page (3-way competition):

Profile.css — page layout
mobileFriendly.css — mobile overrides
pwa-native-feel.css — PWA overrides
SECTION 4 — API CONTRACT STABILISATION (Theory)
4.1 Contract Principles
Principle	Definition	Current Compliance
One Shape Per Endpoint	Each endpoint returns a consistent response structure regardless of conditions	⚠️ PARTIAL — Some endpoints vary shape based on user role or error state
Backend Owns Privacy	All privacy filtering (follower hiding, like count stripping) happens server-side	✅ COMPLIANT — sanitizePostForPrivateLikes() runs on backend
No Field Inference	Frontend renders what backend provides; never reconstructs missing data	⚠️ PARTIAL — Optional chaining masks missing fields
Status + Code Error Handling	Errors handled via HTTP status code + response.data.code	⚠️ PARTIAL — Some flows check message strings
No Message Comparison	Error messages are for display only, not logic	⚠️ VIOLATED — Some error handling compares message text
Composition Deferred	Multi-resource endpoints deferred to scaling phase	✅ COMPLIANT — No premature optimization
4.2 Endpoints with Unstable Shapes
Endpoint	Shape Variation	Impact
GET /api/users/:id	Returns followers as array or { length: N } depending on privacy	Frontend must handle both shapes
GET /api/posts	Returns { posts } object	—
GET /api/feed	Returns { posts } object	Consistent with /posts
GET /api/feed/global	Returns { posts } object	Consistent
POST /api/auth/login	Returns { accessToken, user } or { message, code } on error	Error shape differs from success
POST /api/refresh	Returns { success, accessToken, user } or { message } on error	success field only on success
Error responses	Mix of { message }, { message, code }, { message, details }	Inconsistent error structure
4.3 Excessive Optional Chaining Usage
File	Approximate Count	Indicates
Feed.jsx	100+	Unstable post/user shapes
Profile.jsx	80+	Unstable user/post shapes
apiClient.js	30+	Defensive against null responses
AuthContext.jsx	20+	Defensive against auth state
Settings.jsx	40+	Defensive against user settings
Common Patterns Indicating Contract Drift:

post?.author?._id || post?.author — author shape varies
user?.followers?.length || 0 — followers may be array or object
data?.posts || [] — response may be null
error.response?.data?.code — error structure uncertain
4.4 Error Code vs Status Mismatches
Scenario	Backend Returns	Frontend Checks	Mismatch
Token expired	401 + code: 'TOKEN_EXPIRED'	Sometimes status === 401 only	Code ignored
Account deleted	401 + code: 'ACCOUNT_DELETED'	response.data?.code === 'ACCOUNT_DELETED'	✅ Correct
Account deactivated	403 + code: 'ACCOUNT_DEACTIVATED'	Sometimes status === 403 only	Code ignored
Rate limited	429 + message	status === 429	✅ Correct
Validation error	400 + { message, details }	Sometimes checks message text	Message comparison
Generic auth failure	401 + message	status === 401	✅ Correct
SECTION 5 — GOVERNANCE SUMMARY
5.1 Document Purpose
This charter establishes:

Ownership boundaries for frontend CSS, state, and backend responsibilities
Freeze list of systems that must not be modified
Ignore list of technical debt that can be safely deferred
Future CSS strategy without implementation requirements
API contract principles without refactoring mandates
5.2 Usage Guidelines
Scenario	Action
New feature development	Consult ownership table before adding CSS or state
Bug fix in frozen system	Escalate; do not modify without explicit approval
Performance optimization	Check ignore list; defer if listed
CSS changes	Verify layer boundaries; avoid !important unless documented
API changes	Maintain existing response shapes; add fields, never remove
Error handling	Use status + code; never compare message strings
5.3 Review Cadence
Review Type	Frequency	Scope
Freeze list review	Quarterly	Evaluate if frozen systems can be unfrozen
Ignore list review	Bi-annually	Evaluate if deferred items need attention
Ownership violations	Per PR	Check new code against ownership rules
Contract drift	Monthly	Monitor optional chaining growth
5.4 Amendment Process
Propose change to this charter via documentation PR
Require explicit approval from codebase owner
Document rationale for any freeze/ignore list changes
Update version number and date
APPENDIX A — Quick Reference Tables
A.1 CSS Ownership Quick Reference
CSS Type	Allowed	Forbidden
Page CSS	height, overflow, position, flex/grid structure	—
Component CSS	internal styling, spacing, borders	height: 100vh/dvh/%, overflow, page position
Theme CSS	colors, opacity, typography	height, overflow, position, display
Mobile CSS	device adjustments	competing with page CSS
A.2 State Ownership Quick Reference
State	Source	Access Pattern
Auth status	useAuth()	const { authStatus } = useAuth()
Current user	useAuth()	const { user } = useAuth()
Access token	getAuthToken()	Internal to API utilities only
Auth ready	useAuth()	const { isAuthReady } = useAuth()
A.3 Error Handling Quick Reference
Error Type	Check Pattern
Auth failure	status === 401
Account deleted	status === 401 && code === 'ACCOUNT_DELETED'
Forbidden	status === 403
Rate limited	status === 429
Validation	status === 400
Server error	status >= 500
END OF CHARTER

This document is a governance reference. It contains no code patches, no refactor instructions, and no implementation steps. It is suitable for committing as documentation.