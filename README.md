# Flip & Flow

Flip Chat – Full Lovable App Prompt



Build a modern, premium mobile app called Flip Chat. This is not a clone of YouTube or TikTok, but a unique social platform with two identities for every user: a Personal Account and an optional Creator Page.



Branding



- App Name: Flip Chat

- Tagline: Flip Between Friends. Flip Into Fame.

- Style: Dark mode with vibrant purple, pink, and cyan accents.

- Design: Clean, modern, premium, smooth animations, rounded cards, glassmorphism, and a polished mobile-first UI.



---



Authentication



Allow users to:



- Sign up with email, Google, or phone number.

- Log in.

- Reset password.

- Verify email or phone.



Every new user starts with a Personal Account.



---



Personal Account



The Personal Account is private by default.



Users can:



- Post images.

- Post short video clips.

- Edit profile.

- Send friend requests.

- Accept or decline friend requests.

- Chat only with accepted friends.

- View posts shared by friends.

- Like and comment on friends' posts.

- Block or remove friends.

- Control privacy settings.



Personal Accounts cannot earn money.



---



Creator Page



Each Personal Account can create only one Creator Page.



Users can:



- Create one Creator Page.

- Delete the page if they want to create a new one later.

- Switch instantly between their Personal Account and Creator Page.



Creator Pages are public.



People can:



- Follow Creator Pages.

- Like videos.

- Comment.

- Share.

- Save videos.



Creator Pages have:



- Public profile.

- Bio.

- Links.

- Followers count.

- Total video views.

- Creator dashboard.

- Analytics.



---



Video Feed



Create a smooth vertical scrolling feed.



Features:



- Infinite scrolling.

- Auto-play.

- Like.

- Comment.

- Share.

- Save.

- Report.

- Follow creator.

- Suggested creators.

- Trending hashtags.



---



Search



Allow searching by:



- Creator

- Username

- Video

- Hashtag



---



Messaging



Only Personal Accounts can send friend requests.



Workflow:



1. Send friend request.

2. Recipient accepts or declines.

3. If accepted, private chat becomes available.

4. If removed or blocked, chat is disabled.



Chat features:



- Text messages

- Image messages

- Voice notes (future-ready)

- Read receipts

- Typing indicator

- Online status



---



Notifications



Notify users when:



- Someone follows their Creator Page.

- Someone sends a friend request.

- Friend request accepted.

- Someone likes or comments.

- Someone shares a video.

- Creator becomes eligible for monetization.

- Gifts received.



---



Monetization



Gifts Program



Requirements:



- Minimum 1,000 followers.

- Minimum 500,000 total video views during the last 60 days.



When eligible:



- Enable receiving virtual gifts.

- Display earnings dashboard.



---



Ads Program



Requirements:



- Minimum 10,000 followers.

- Minimum 5,000,000 total video views during the last 90 days.



When eligible:



- Enable ad revenue sharing.

- Display estimated earnings.



---



Creator Dashboard



Display:



- Followers.

- Views.

- Watch time.

- Earnings.

- Gift earnings.

- Ad earnings.

- Monetization eligibility progress.

- Top-performing videos.



---



Profile Switching



Add a profile switcher in the account menu.



Options:



- Personal Account

- Creator Page

- Manage Creator Page

- Settings

- Logout



Switching should be instant without logging out.



---



Admin Dashboard



Create an admin panel where administrators can:



- Manage users.

- Manage Creator Pages.

- Review reports.

- Remove videos.

- Ban or suspend accounts.

- Verify creators.

- Feature creators.

- Manage monetization approvals.

- View platform analytics.



---



Future Features



Design the architecture so these can be added later:



- Live streaming

- Stories

- AI captions

- AI moderation

- Creator subscriptions

- Video collaborations

- Music library

- Creator marketplace

- Verified badges

- Premium memberships



---



Technical Requirements



Use:



- Flutter frontend

- Supabase backend

- Supabase Authentication

- PostgreSQL database

- Supabase Storage for media

- Row Level Security (RLS)

- Responsive design

- Smooth animations

- Secure APIs

- Scalable architecture



Generate:



- Complete database schema.

- Authentication flow.

- Navigation.

- Beautiful mobile UI.

- Reusable components.

- Production-ready folder structure.

- Clean, maintainable code.



The app should feel premium, fast, original, and built for millions of users while keeping the Flip Chat identity distinct from existing social media platforms.



Advertising System



Flip Chat uses a native short-video advertising experience similar to YouTube Shorts.



In-Feed Video Ads



Display sponsored vertical videos between public Creator Page videos.



Requirements:



- Show one sponsored video after every 5–10 videos (configurable by administrators).

- Ads autoplay just like normal videos.

- Users can immediately swipe to the next video.

- Every ad must display a clear Sponsored label.

- Ads can include a Call-to-Action button such as Learn More, Install, Shop Now, or Visit Website.

- Users can like, share, and comment on ads if enabled by the advertiser.



Ad Placement



Ads should only appear:



- In the public Creator Page feed.

- On the Discover page.

- In Search results as sponsored content.



Ads must never appear:



- In Personal Account feeds.

- Inside private chats.

- On Friend Request screens.

- On Settings pages.

- Between private posts shared only with friends.



Creator Ad Revenue



Creators do not earn money for watching advertisements.



Instead, eligible Creator Pages earn a share of the advertising revenue generated from ads shown alongside their public content.



Ads Program Eligibility



- At least 10,000 followers

- At least 5,000,000 public video views in the last 90 days



Once eligible, creators automatically begin earning from ads displayed in the public feed around their videos.



Admin Controls



Administrators can:



- Adjust how often ads appear (for example, every 5–10 videos).

- Approve or reject advertisements.

- Remove ads that violate platform policies.

- Set creator revenue-sharing percentages.

- Monitor advertising performance and revenue.



The advertising experience should feel seamless and natural, similar to short-video platforms, without interrupting the viewing experience.



Use the attached image as reference for the ui design and features and logo used

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://flip-verse-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b849ba32-089e-4ad9-bdfb-c6ffe0904999).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
