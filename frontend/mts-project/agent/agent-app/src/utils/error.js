export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    if (typeof message === 'string' && message.trim()) {
        if (status && status >= 500) {
            return fallback;
        }

        return message.trim();
    }

    return fallback;
};
