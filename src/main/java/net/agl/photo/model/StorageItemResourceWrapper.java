package net.agl.photo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import net.agl.photo.api.model.StorageItem;
import net.agl.photo.api.model.StorageItemJSON;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * @author valinor
 * @since 24.01.2018
 */
public abstract class StorageItemResourceWrapper implements StorageItemJSON {
    private StorageItem entity;
    private Integer order;
    private Map<String, String> links = new HashMap<>();

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

    @Override
    public Map<String, String> getLinks() {
        return links;
    }

    public void addLink(String rel, String url) {
        links.put(rel, url);
    }

    public void removeLink(String rel) {
        links.remove(rel);
    }

}
