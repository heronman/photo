package net.agl.photo.exceptions;

/**
 * @author valinor
 * @since 2018-01-29
 */
public class InternalException extends RuntimeException {
    public InternalException() {
        super();
    }
    public InternalException(String message) {
        super(message);
    }
    public InternalException(Throwable cause) {
        super(cause);
    }
    public InternalException(String message, Throwable cause) {
        super(message, cause);
    }
}
