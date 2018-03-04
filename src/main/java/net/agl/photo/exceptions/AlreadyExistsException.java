package net.agl.photo.exceptions;

/**
 * @author valinor
 * @since 2018-01-29
 */
public class AlreadyExistsException extends RuntimeException {
    public AlreadyExistsException(String message) {
        super(message);
    }
    public AlreadyExistsException(Throwable cause) {
        super(cause);
    }
    public AlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
}
