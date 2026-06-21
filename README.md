
# Favor

Favor is a MERN app for small private groups. Members join with an invite code,
post favors, pick up work, request transfers, and move work through a simple
three step status.

## Run locally

1. Copy `backend/.env.example` to `backend/.env`.
2. Add a local or hosted MongoDB connection string.
3. Install packages with `npm install`, `npm install --prefix backend`, and
   `npm install --prefix frontend`.
4. Start both apps with `npm run dev`.

The frontend runs at `http://localhost:5173` and the API at
`http://localhost:5000`.

## Deploy the backend to Railway

1. Create a Railway service from this GitHub repository.
2. Set the service root directory to `/backend`.
3. Set the config file path to `/backend/railway.toml`.
4. Add these service variables:
   - `MONGO_URI`: your MongoDB connection string.
   - `JWT_SECRET`: a long random secret used to sign login tokens.
   - `CLIENT_ORIGIN`: the deployed frontend origin, without a trailing slash.
     Separate multiple allowed origins with commas.
5. Generate a public Railway domain for the service.
6. Set the frontend's `VITE_API_URL` to `https://your-domain.up.railway.app/api`
   and rebuild the frontend.

Railway supplies `PORT` automatically. The deployment health check uses
`/health`.

## Permissions

- Any member can post or pick up a favor in their group.
- The poster and current helper can move a favor's status forward or back one step.
- The current helper can drop an unfinished favor, returning it to the posted state.
- The poster can approve any transfer request; the current helper can also
  approve who takes over.
- Pickup requests remain visible until the requester withdraws or is accepted.
- Posters can delete their own favors. Group leaders can delete any favor in
  their group and can delete the group.
