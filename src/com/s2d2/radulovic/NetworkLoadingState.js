// Browser equivalent of the Kotlin NetworkLoadingState singleton.
// StateFlow.value becomes activeRequests.value; subscribe supports future UI binding.
let actualActiveRequests = 0;
let hideGeneration = 0;
let publishedActiveRequests = 0;
const listeners = new Set();

function publish(value) {
  if (publishedActiveRequests === value) return;
  publishedActiveRequests = value;
  for (const listener of listeners) listener(value);
}

const activeRequests = Object.freeze({
  get value() {
    return publishedActiveRequests;
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
});

const NetworkLoadingState = Object.freeze({
  activeRequests,

  requestStarted() {
    hideGeneration += 1;
    actualActiveRequests += 1;
    publish(actualActiveRequests);
  },

  requestFinished() {
    actualActiveRequests = Math.max(0, actualActiveRequests - 1);

    if (actualActiveRequests > 0) {
      publish(actualActiveRequests);
      return;
    }

    hideGeneration += 1;
    const scheduledGeneration = hideGeneration;
    setTimeout(() => {
      if (actualActiveRequests === 0 && hideGeneration === scheduledGeneration) {
        publish(0);
      }
    }, 250);
  },
});

export default NetworkLoadingState;
