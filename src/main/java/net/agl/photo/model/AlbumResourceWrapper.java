package net.agl.photo.model;

import net.agl.photo.controller.PhotoController;

import static org.springframework.hateoas.mvc.ControllerLinkBuilder.linkTo;
import static org.springframework.hateoas.mvc.ControllerLinkBuilder.methodOn;

/**
 * @author valinor
 * @since 24.01.2018
 */
public class AlbumResourceWrapper extends StorageItemResourceWrapper {
    public AlbumResourceWrapper(Album entity) {
        super(entity);
    }

    protected void setLinks() {
        add(linkTo(methodOn(PhotoController.class).listAlbumContents(getEntity().getId())).withSelfRel());
    }

    @Override
    public Boolean isFolder() {
        return true;
    }

}
