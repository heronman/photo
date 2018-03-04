package net.agl.photo.api.model;

import java.util.Date;

/**
 * @author valinor
 * @since 2018-01-08
 */
public interface StorageItem extends StorageItemRO {

    String getId();

    void setCreated(Date created);

    void setModified(Date modified);

    void setTitle(String title);

    void setDescription(String description);

}
