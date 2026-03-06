# Life Board Widget System

This document describes the new widget system for the Life Board application, which allows users to add, remove, and manage various widgets from different parts of the application.

## Features

1. **Widget Management**
   - Add/remove widgets from a centralized widget manager
   - Drag and drop to reorder widgets
   - Toggle fullscreen mode for any widget
   - Default widgets for common tasks (Todo List, Calendar, etc.)

2. **Google Calendar Integration**
   - Secure OAuth2 authentication
   - View and manage calendar events
   - Persistent authentication using localStorage

3. **File Scanner**
   - Automatically discovers HTML files in the project
   - Makes it easy to add new widgets from existing applications

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd path/to/life-board
   npm install express cors
   ```

2. **Configure Google OAuth**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Calendar API
   - Create OAuth 2.0 credentials (Web application type)
   - Add `http://localhost:3000` to Authorized JavaScript origins
   - Update the `GOOGLE_CLIENT_ID` and `GOOGLE_API_KEY` in `integrations.js`

3. **Start the Development Server**
   ```bash
   node server.js
   ```
   This will start a local server at `http://localhost:3000`

## Adding New Widgets

1. **From Existing HTML Files**
   - Place your HTML file in any subdirectory
   - The file scanner will automatically detect it
   - Access it through the Widget Manager

2. **Custom Widgets**
   - Click "Add Custom Widget" in the Widget Manager
   - Provide a name and URL (can be relative or absolute)
   - Click "Add Widget"

## Default Widgets

- **Todo List**: A simple task management widget
- **Hindu Calendar**: Displays Hindu lunar calendar information
- **Google Calendar**: Integrated calendar with Google Calendar API
- **Kanban Board**: Task management board
- **Pomodoro Timer**: Productivity timer
- **Markdown Editor**: Rich text editor for notes
- **Portfolio Manager**: Track investments
- **Stock Ticker**: Real-time stock market data

## Troubleshooting

- **Widget not loading**: Check browser console for errors
- **Google Auth issues**: Verify your OAuth credentials and redirect URIs
- **Missing widgets**: Ensure the server is running and files are accessible

## Security Notes

- Google OAuth tokens are stored in localStorage
- Always use HTTPS in production
- Never commit sensitive credentials to version control

## License

This project is open source and available under the MIT License.
