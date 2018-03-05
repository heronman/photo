package net.agl.photo.model;

/**
 * @author valinor
 * @since 24.01.2018
 */
public class PhotoResourceWrapper extends StorageItemResourceWrapper {

    public PhotoResourceWrapper(Photo entity) {
        super(entity);
    }

    public void setLinks() {
        addLink("self", "photo/" + getAlbumId() + "/" + getItemId());
    }

    public String getAlbumId() {
        return getEntity().getAlbumId();
    }

    @Override
    public Photo getEntity() {
        return (Photo)super.getEntity();
    }

    @Override
    public Boolean isFolder() {
        return false;
    }

    public Long getSize() {
        return getEntity().getSize();
    }

}
