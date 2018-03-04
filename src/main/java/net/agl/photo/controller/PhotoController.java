package net.agl.photo.controller;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import net.agl.photo.api.service.PhotoService;
import net.agl.photo.exceptions.AlreadyExistsException;
import net.agl.photo.exceptions.InternalException;
import net.agl.photo.exceptions.ItemNotFoundException;
import net.agl.photo.exceptions.NotEmptyException;
import net.agl.photo.model.Album;
import net.agl.photo.model.AlbumResourceWrapper;
import net.agl.photo.model.Photo;
import net.agl.photo.model.PhotoResourceWrapper;
import net.agl.photo.model.StorageItemResourceWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.ResourceSupport;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.FileNotFoundException;
import java.nio.file.NoSuchFileException;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * @author valinor
 * @since 2018-01-16
 */
@RestController
@RequestMapping(path = "/photo")
public class PhotoController {

    @Autowired
    private PhotoService service;

    @RequestMapping(path = "/",
            method = RequestMethod.GET,
            consumes = MediaType.ALL_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public HttpEntity<List<AlbumResourceWrapper>> listAlbums() {
        return ResponseEntity.ok(
                service.listAlbums()
                        .map(AlbumResourceWrapper::new)
                        .peek(w -> w.setOrder(service.getItemOrder(w.getEntity())))
                        .sorted(Comparator.comparing(StorageItemResourceWrapper::getOrder,
                                Comparator.nullsLast(Integer::compare)))
                        .collect(Collectors.toList())
        );
    }

    @RequestMapping(path = "/",
            method = RequestMethod.PUT,
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public HttpEntity<ResourceSupport> createAlbum(@RequestBody ItemAttrs attrs) {
        return ResponseEntity.ok(new AlbumResourceWrapper(service.createAlbum(attrs.getTitle(), attrs.getDescription())));
    }

    @RequestMapping(path = "/{album}",
            method = RequestMethod.GET,
            consumes = MediaType.ALL_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public HttpEntity<List<? extends ResourceSupport>> listAlbumContents(@PathVariable("album") String album) {
        return new ResponseEntity<>(service
                .getAlbumContent(album).map(PhotoResourceWrapper::new)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    @RequestMapping(path = "/{album}",
            method = RequestMethod.POST,
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public HttpEntity<ResourceSupport> updateAlbum(@PathVariable("album") String albumId, @RequestBody ItemAttrs attrs) {
        Album album = service.getAlbum(albumId);
        album.setTitle(attrs.title);
        album.setDescription(attrs.description);
        service.updateITem(album);
        return ResponseEntity.ok(new AlbumResourceWrapper(album));
    }

    @RequestMapping(path = "/{album}", method = RequestMethod.DELETE)
    public HttpEntity deleteAlbum(@PathVariable("album") String album) {
        service.deleteAlbum(album);
        return ResponseEntity.noContent().build();
    }

    @RequestMapping(path = "/{album}",
            method = RequestMethod.PUT,
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public HttpEntity<ResourceSupport> upload(@PathVariable("album") String albumId,
                                              @RequestPart(name = "file") MultipartFile file,
                                              @RequestParam(value = "title", required = false) String title,
                                              @RequestParam(value = "description", required = false) String description) {
        return ResponseEntity.ok(new PhotoResourceWrapper(service.savePhoto(albumId, file, title, description)));
    }

    @RequestMapping(value = "/{album}/{photo}", method = RequestMethod.GET)
    public void download(@PathVariable("album") String albumName, @PathVariable("photo") String photoName,
                         HttpServletResponse response) {
        service.download(albumName, photoName, response);
    }

    @RequestMapping(path = "/{album}/{photo}",
            method = RequestMethod.POST,
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public HttpEntity<ResourceSupport> updatePhoto(@PathVariable("album") String albumId,
                                                   @PathVariable("photo") String photoId,
                                                   @RequestBody ItemAttrs attrs) {
        Photo photo = service.getPhoto(albumId, photoId);
        photo.setTitle(attrs.title);
        photo.setDescription(attrs.description);
        service.updateITem(photo);
        return ResponseEntity.ok(new PhotoResourceWrapper(photo));
    }

    @RequestMapping(path = "/{album}/{photo}", method = RequestMethod.DELETE)
    public HttpEntity deletePhoto(@PathVariable("album") String album, @PathVariable("photo") String photo) {
        try {
            service.deletePhoto(album, photo);
            return ResponseEntity.noContent().build();
        } catch (NoSuchFileException | FileNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR, reason = "Internal server error")
    @ExceptionHandler({InternalException.class})
    public void internalError() {
        // Nothing to do
    }

    @ResponseStatus(value = HttpStatus.NOT_FOUND, reason = "Item not found")
    @ExceptionHandler({ItemNotFoundException.class})
    public void itemNotFoundError() {
        // Nothing to do
    }

    @ResponseStatus(value = HttpStatus.CONFLICT, reason = "Item already exists")
    @ExceptionHandler({AlreadyExistsException.class})
    public void confilctError() {
        // Nothing to do
    }

    @ResponseStatus(value = HttpStatus.BAD_REQUEST, reason = "Bad request")
    @ExceptionHandler({IllegalArgumentException.class})
    public void badRequestError() {
        // Nothing to do
    }

    @ResponseStatus(value = HttpStatus.METHOD_NOT_ALLOWED, reason = "The directory is not empty")
    @ExceptionHandler({NotEmptyException.class})
    public void dirNotEmptyError() {
        // Nothing to do
    }

    public static class ItemAttrs {
        private String title;
        private String description;

        @JsonCreator
        public ItemAttrs(@JsonProperty(value = "title", required = true) String title,
                         @JsonProperty("description") String description) {
            this.title = title;
            this.description = description;
        }

        public String getTitle() {
            return title;
        }

        public String getDescription() {
            return description;
        }
    }

}
