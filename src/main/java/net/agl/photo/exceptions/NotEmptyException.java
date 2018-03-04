package net.agl.photo.exceptions;

/**
 * @author valinor
 * @since 2018-01-29
 */
public class NotEmptyException extends RuntimeException {
    public NotEmptyException(String message) {
        super(message);
    }
    public NotEmptyException(Throwable cause) {
        super(cause);
    }
    public NotEmptyException(String message, Throwable cause) {
        super(message, cause);
    }
}
