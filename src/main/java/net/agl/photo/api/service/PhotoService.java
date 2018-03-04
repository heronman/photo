package net.agl.photo.api.service;

import net.agl.photo.api.model.StorageItem;
import net.agl.photo.model.Album;
import net.agl.photo.model.Photo;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.stream.Stream;

/**
 * @author valinor
 * @since 2018-01-16
 */
public interface PhotoService {

    Stream<? extends Album> listAlbums();

    Album createAlbum(String title, String descr);

    Album getAlbum(String name) throws IllegalArgumentException;

    Stream<? extends Photo> getAlbumContent(String album);

    void deleteAlbum(String albumId);

    Photo savePhoto(String albumId, MultipartFile file, String title, String descr);

    Photo getPhoto(String albumId, String photoId) throws IllegalArgumentException;

    void download(String albumName, String photoName, HttpServletResponse response);

    void deletePhoto(String albumId, String photoId) throws IOException;

    void updateITem(StorageItem item);

    boolean isAlbumTitleExists(String title);

    Integer getItemOrder(StorageItem item);

}
