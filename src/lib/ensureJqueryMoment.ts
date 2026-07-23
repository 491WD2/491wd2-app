import moment from "moment";
import $ from "jquery";

/** Attach jQuery/moment for legacy UMD/CJS plugins (daterangepicker). */
Object.assign(window, { moment, jQuery: $, $ });

export { moment, $ };
