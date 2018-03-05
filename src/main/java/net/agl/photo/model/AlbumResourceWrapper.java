package net.agl.photo.model;

/**
 * @author valinor
 * @since 24.01.2018
 */
public class AlbumResourceWrapper extends StorageItemResourceWrapper {
    public AlbumResourceWrapper(Album entity) {
        super(entity);
    }

    protected void setLinks() {
        addLink("self", "photo/" + getEntity().getId());
    }

    @Override
    public Boolean isFolder() {
        return true;
    }

}
