package net.agl.photo.api.model;

/**
 * @author valinor
 * @since 24.01.2018
 */
public interface PhotoItem extends PhotoItemRO {

    String getAlbumId();

    void setSize(Long size);

}
