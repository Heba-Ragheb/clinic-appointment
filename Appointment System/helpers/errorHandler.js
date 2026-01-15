/**
 * import this function whenever you need to handle an error
 * best use case inside next()
 * for example next(errorHandler(404, error.message))
 */

export const errorHandler = (code, msg) => {
	const error = new Error();
	error.statusCode = code;
	error.message = msg;
	return error;
};
