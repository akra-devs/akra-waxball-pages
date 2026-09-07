# WAXBALL Privacy Policy

Version: 1.2.0

Effective date: 2026-09-07

Public policy: https://waxball.akra.kr/privacy/

WAXBALL is operated by AKRA (akra-devs). Privacy questions may be sent to
help@akra.kr. Sound, graphics, gem-wallet, ownership,
and gameplay progress settings are stored on the device. WAXBALL does not create
an AKRA account or upload those local settings to an AKRA-operated database.

When an advertising-enabled build is used, Google Mobile Ads and Google User
Messaging Platform may process device or account identifiers, advertising IDs,
IP-derived approximate location, diagnostics, app interactions, and consent
choices for ad delivery, measurement, fraud prevention, and privacy controls.
Google's processing and retention are governed by Google's policies and the
user's consent choices. A privacy-options entry is shown in the app when UMP
reports that it is required.

The Android app uses Firebase Analytics to analyze ball selection, play starts
and completions, rewards, limited 3D preparation, retries and simpler-graphics
transitions, and ad readiness, eligibility and presentation results. Ad fields
are limited to format, app placement, fixed stages and reasons, numeric error
codes, cached-ad age buckets, and app version, build and production/test labels.
3D diagnostics use fixed error codes, preparation stages, scene kinds, quality
tiers and retry categories. The AdMob link can also provide ad impressions and
revenue. The app does not add names, email addresses, account IDs, user input,
raw touch coordinates, gem balances, raw exceptions, stack traces, ad response
IDs, device hashes or raw referral URLs to Analytics fields. Copied diagnostic
text is not transmitted either. The Firebase SDK itself may process app/device
metadata and app-instance identifiers. Analytics Android advertising-ID
collection and ad-personalization signals are disabled. Retention and deletion
follow Firebase and Google Analytics policies.

These Android advertising, Analytics and Crashlytics collection paths do not
run in the web app.

The Android app always uses Firebase Crashlytics to diagnose crashes, ANRs,
unhandled Flutter and Dart errors, and selected startup failures. Crashlytics
may process crash stack traces, relevant app state and device metadata, app and
operating-system versions, device characteristics, Crashlytics installation
UUIDs, Firebase installation IDs, and session identifiers. WAXBALL adds only
reviewed reason codes and bounded app version, build, channel, target, config
revision, route, lifecycle, renderer, audio-focus, and operation context. It
does not add names, email addresses, phone numbers, account IDs, user-entered
content, raw touch coordinates, gem balances, credentials, ad-consent state, or
raw exception messages, and it does not set a Crashlytics user ID. Google states
that Crashlytics reports and associated identifiers are retained for 90 days
before deletion begins.

Users can remove locally stored WAXBALL data through the operating system's app
data controls or by uninstalling the app. Uninstalling stops future collection
but does not immediately shorten the retention period of reports already sent.

## Optional news notifications and attendance

If you enable news notifications, Firebase Cloud Messaging (FCM) processes a Firebase installation ID, a messaging registration token and delivery-related information to deliver WAXBALL news and service notices. The app subscribes to an app/channel/language topic. AKRA does not log registration tokens or send wallet balances or attendance receipts to FCM. You can turn notifications off in app settings or Android settings; opting out requests deletion of its FCM token and stops automatic registration, retrying cleanup on a later connection if offline. Received news is retained only for the current app process. Signed notices are downloaded over HTTPS from GitHub Pages; GitHub may process standard connection metadata under its privacy policy. Attendance dates and daily gem claims are stored only on your device and are lost if app data is cleared.
