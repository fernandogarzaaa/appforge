export const buildApiError = async (response) => {
  let details = null;
  try {
    details = await response.json();
  } catch (error) {
    details = null;
  }

  const message = details?.message || details?.error || response.statusText || 'Request failed';
  const err = new Error(message);
  err.status = response.status;
  err.details = details;
  return err;
};

export const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw await buildApiError(response);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};
