const LOG_EVENT_NAME = "nexofin:log";

let globalHandlersRegistered = false;

function normalizeMeta(meta = {}) {
  if (!meta || typeof meta !== "object") return {};
  return meta;
}

export function serializeError(error) {
  if (!error) {
    return {
      name: "Error",
      message: "Unknown error",
      stack: null,
      code: null,
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
      stack: null,
      code: null,
    };
  }

  return {
    name: error.name || "Error",
    message: error.message || "Unknown error",
    stack: error.stack || null,
    code: error.code || null,
  };
}

function dispatchLogEvent(entry) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(LOG_EVENT_NAME, {
      detail: entry,
    })
  );
}

function writeConsole(level, entry) {
  const consoleMethod =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  consoleMethod("[NexoFin]", entry.message, entry);
}

export function createLogEntry(level, message, meta = {}) {
  return {
    level,
    message,
    meta: normalizeMeta(meta),
    timestamp: new Date().toISOString(),
  };
}

export function logError(message, error = null, meta = {}) {
  const entry = createLogEntry("error", message, {
    ...normalizeMeta(meta),
    error: serializeError(error),
  });
  writeConsole("error", entry);
  dispatchLogEvent(entry);
  return entry;
}

export function registerGlobalErrorHandlers() {
  if (globalHandlersRegistered || typeof window === "undefined") {
    return;
  }

  const handleWindowError = (event) => {
    logError("Unhandled window error", event.error || event.message || null, {
      source: "window.error",
      filename: event.filename || null,
      lineno: event.lineno || null,
      colno: event.colno || null,
    });
  };

  const handleUnhandledRejection = (event) => {
    logError("Unhandled promise rejection", event.reason || null, {
      source: "window.unhandledrejection",
    });
  };

  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);
  globalHandlersRegistered = true;
}
