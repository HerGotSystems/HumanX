import humanxWorker from './worker.js';
import { handleUntestedRequest } from './untested.js';

const UNTESTED_SESSION_LIMIT = 30;
const UNTESTED_SESSION_WINDOW_MS = 60 * 60 * 1000;

function safeEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!left || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff