package net.agl.photo.model;

import net.agl.photo.api.model.StorageItem;

import java.util.Date;

/**
 * @author valinor
 * @since 2018-01-28
 */
public abstract class BasicStorageItem implements StorageItem {

    private final String id;
    private Date created, modified;
    private String title;
    private String description;

    BasicStorageItem(String id) {
        this.id = id;
    }

    @Override
    public String getId() {
        return id;
    }

    @Override
    public Date getCreated() {
        return created;
    }

    @Override
    public void setCreated(Date created) {
        this.created = created;
    }

    @Override
    public Date getModified() {
        return modified;
    }

    @Override
    public void setModified(Date modified) {
        this.modified = modified;
    }

    @Override
    public String getTitle() {
        if (title == null)
            return getId();
        else
            return title;
    }

    @Override
    public void setTitle(String title) {
        this.title = title;
    }

    @Override
    public String getDescription() {
        return description;
    }

    @Override
    public void setDescription(String description) {
        this.description = description;
    }

}
