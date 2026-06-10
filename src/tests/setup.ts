import '@testing-library/jest-dom';

// Force a deterministic timezone for date-formatting tests. Several specs
// assert wall-clock strings against fixed `+02:00` / `+01:00` inputs and
// must run identically regardless of the host machine's TZ.
process.env.TZ = 'Europe/Paris';
