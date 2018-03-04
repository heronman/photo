package net.agl.photo.model;

import net.agl.photo.controller.PhotoController;

import static org.springframework.hateoas.mvc.ControllerLinkBuilder.linkTo;

/**
 * @author valinor
 * @since 24.01.2018
 */
public class PhotoResourceWrapper extends StorageItemResourceWrapper {

    public PhotoResourceWrapper(Photo entity) {
        super(entity);
    }

    public void setLinks() {
        add(linkTo(PhotoController.class).slash(getAlbumId()).slash(getItemId()).withSelfRel());
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
