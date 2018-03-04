package net.agl.photo.model;

import net.agl.photo.api.model.PhotoItem;

/**
 * @author valinor
 * @since 2018-01-16
 */
public class Photo extends BasicStorageItem implements PhotoItem {

    private final String albumId;
    private Long size;

    public Photo(String albumId, String id) {
        super(id);
        this.albumId = albumId;
    }

    @Override
    public String getAlbumId() {
        return albumId;
    }

    @Override
    public Long getSize() {
        return size;
    }

    @Override
    public void setSize(Long size) {
        this.size = size;
    }

}
