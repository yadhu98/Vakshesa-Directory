# Vksha Admin Panel

React-based admin dashboard for managing the family event system.

## Features

- User management
- Family management
- Stall and sales tracking
- Leaderboard visualization
- Event settings and phase control
- Excel file upload for family data
- Real-time dashboard statistics

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Admin panel will be available at `http://localhost:3001`

## Build

```bash
npm run build
```

## Environment Variables

Create `.env` file:

```
VITE_API_URL=http://localhost:5000/api
```

## Default Credentials

- Email: `admin@vksha.com`
- Password: `change_me` (change in production)

## Pages

- **Dashboard**: Overview with statistics and leaderboard
- **Users**: Manage user accounts and profiles
- **Families**: View and manage family structures
- **Stalls**: Manage event stalls and shopkeepers
- **Leaderboard**: Real-time points leaderboard
- **Event Settings**: Control phase 2 activation and event parameters

## Technologies

- React 18
- TypeScript
- Vite
- TailwindCSS
- Recharts for visualizations
- Axios for API calls

## Deployment

Ready for Vercel deployment. See root README for instructions.
