package net.agl.photo.exceptions;

/**
 * @author valinor
 * @since 2018-01-29
 */
public class ItemNotFoundException extends RuntimeException {
    public ItemNotFoundException(String message) {
        super(message);
    }
    public ItemNotFoundException(Throwable cause) {
        super(cause);
    }
    public ItemNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
