package net.agl.photo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import net.agl.photo.api.model.StorageItem;
import net.agl.photo.api.model.StorageItemRO;
import org.springframework.hateoas.ResourceSupport;

import java.util.Date;

/**
 * @author valinor
 * @since 24.01.2018
 */
public abstract class StorageItemResourceWrapper extends ResourceSupport implements StorageItemRO {
    private StorageItem entity;
    private Integer order;

    public StorageItemResourceWrapper(StorageItem entity) {
        this.entity = entity;
        setLinks();
    }

    protected abstract void setLinks();

    public String getItemId() {
        return entity.getId();
    }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    @Override
    public Date getCreated() {
        return entity.getCreated();
    }

    @Override
    public Date getModified() {
        return entity.getModified();
    }

    @Override
    public String getTitle() {
        return entity.getTitle();
    }

    @Override
    public String getDescription() {
        return entity.getDescription();
    }

    @JsonIgnore
    public StorageItem getEntity() {
        return entity;
    }

    public abstract Boolean isFolder();

}
