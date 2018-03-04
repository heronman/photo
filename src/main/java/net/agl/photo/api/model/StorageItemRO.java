package net.agl.photo.api.model;

import java.util.Date;

/**
 * @author valinor
 * @since 2018-01-08
 */
public interface StorageItemRO {

    Date getCreated();

    Date getModified();

    String getTitle();

    String getDescription();

}
