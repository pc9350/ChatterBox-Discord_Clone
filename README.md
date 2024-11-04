
# ChatterBox

This project is a Discord clone, built with a modern tech stack to emulate the core functionality and sleek design of the popular messaging platform.

## Technologies Used

- **TypeScript**: Provides static typing, improving code quality and development experience.
- **Next.js**: A React framework that allows for server-side rendering and static site generation, enhancing performance.
- **Tailwind CSS**: For a utility-first approach to styling, allowing for responsive and customizable design.
- **Convex**: A real-time backend that supports live updates and simplifies data handling.
- **Clerk**: Manages user authentication and access control seamlessly.
- **shadcn**: Ensures consistent and modern UI component styling.

## Features

- **Real-time Chat**: Supports live messaging in various channels.
- **Direct Messaging (DMs)**: Users can send private messages directly to friends.
- **Friend Requests**: Users can connect with others by sending and accepting friend requests.
- **Attachments in Chat**: Share files, images, and other attachments within messages.
- **User Authentication**: Secure login and account management powered by Clerk.
- **Custom UI**: Styled with Tailwind and shadcn for a visually appealing and responsive user experience.
- **Backend Functionality**: Convex provides data storage and real-time capabilities.

## Getting Started

1. Clone the repository:
   ```bash
   git clone <your-repo-link>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables for Clerk and Convex as per your requirements.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

- **Sign Up / Sign In**: New users can register and log in securely using Clerk.
- **Friend and Message**: Send friend requests and start a direct chat with any accepted friend.
- **Channels and Attachments**: Join or create channels, and share attachments within messages, all updated in real-time.