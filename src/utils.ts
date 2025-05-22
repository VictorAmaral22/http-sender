export const getErrorMessage = (status?: number) => {
    const messages: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        408: 'Request Timeout',
        409: 'Conflict',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
    }
    return status ? messages[status] || 'Unknown Error' : 'Network Error'
}

export const getMethodColor = (method: string) => {
    const colors = {
        GET: '#7d4cdb',
        POST: '#4caf50',
        PUT: '#ff9800',
        DELETE: '#f44336',
        PATCH: '#e91e63',
    };
    return colors[method as keyof typeof colors] || '#7d4cdb';
};