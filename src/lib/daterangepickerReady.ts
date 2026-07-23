/**
 * Ensure window.moment / window.jQuery exist before daterangepicker evaluates.
 * Its CJS path prefers those globals; otherwise Vite's require('moment') may
 * yield a namespace object and crash with "moment is not a function".
 */
import { moment, $ } from "./ensureJqueryMoment";
import "daterangepicker";
import "daterangepicker/daterangepicker.css";

export { moment, $ };
