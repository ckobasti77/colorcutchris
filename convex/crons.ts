import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Zahtevi na čekanju stariji od settings.holdHours (podrazumevano 48 h) ističu → „otkazan" / „isteklo".
crons.interval("expire pending booking requests", { hours: 1 }, internal.bookings.expirePending, {});

export default crons;
