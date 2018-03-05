package net.agl.photo.service;

import net.agl.photo.api.model.PhotoItem;
import net.agl.photo.api.model.StorageItem;
import net.agl.photo.api.service.PhotoService;
import net.agl.photo.exceptions.AlreadyExistsException;
import net.agl.photo.exceptions.InternalException;
import net.agl.photo.exceptions.ItemNotFoundException;
import net.agl.photo.exceptions.NotEmptyException;
import net.agl.photo.model.Album;
import net.agl.photo.model.Photo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.FileImageInputStream;
import javax.imageio.stream.ImageInputStream;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.file.DirectoryNotEmptyException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.NotDirectoryException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * @author valinor
 * @since 2018-01-16
 */
@Service
public class FileService implements PhotoService {

    private static final String PROP_PHOTO_ROOT = "photo.storage.root";
    private static final String ORDER_FILE_NAME = ".order";
    private static final String DIR_DESCRIPTOR_FILE_NAME = ".description";
    private static final String FILE_DESCRIPTOR_EXT = ".descr";
    private static final String DEFAULT_PHOTO_ROOT = "photo";
    private static final Pattern UUID_REGEX = Pattern.compile("^[\\da-f]{8}(-[\\da-f]{4}){3}-[\\da-f]{12}$");

    private Path root;

    @Autowired
    public FileService(Environment env) {
        try {
            root = Paths.get(env.getProperty(PROP_PHOTO_ROOT, DEFAULT_PHOTO_ROOT));
            if (!Files.exists(root))
                Files.createDirectories(root);
            if (!Files.isDirectory(root))
                throw new NotDirectoryException(root.toString());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public Stream<Album> listAlbums() {
        try {
            return Files.list(root)
                    .filter(Files::isDirectory)
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .filter(UUID_REGEX.asPredicate())
                    .map(Album::new)
                    .peek(this::fillAttributes);
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    @Override
    public Album getAlbum(String albumId) throws IllegalArgumentException {
        assertUuid(albumId, "Bad album ID");
        Path path = root.resolve(albumId);
        if (!Files.isDirectory(path))
            throw new ItemNotFoundException(albumId);
        return fillAttributes(new Album(albumId));
    }

    @Override
    public Photo getPhoto(String albumId, String photoId) throws IllegalArgumentException {
        assertUuid(albumId, "Bad album ID");
        assertUuid(photoId, "Bad photo ID");
        Path path = root.resolve(albumId).resolve(photoId);
        if (!Files.isRegularFile(path))
            throw new ItemNotFoundException(albumId + "/" + photoId);
        return fillAttributes(new Photo(albumId, photoId));
    }

    @Override
    public Stream<Photo> getAlbumContent(String albumId) {
        assertUuid(albumId, "Bad album ID");
        Path path = root.resolve(albumId);
        if (!Files.exists(path) || !Files.isDirectory(path))
            throw new ItemNotFoundException(albumId);

        try {
            return Files.list(path)
                    .filter(Files::isRegularFile)
                    .map(Path::getFileName)
                    .map(Path::toString)
                    .filter(UUID_REGEX.asPredicate())
                    .map(p -> new Photo(albumId, p))
                    .peek(this::fillAttributes);
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    @Override
    public Album createAlbum(String title, String descr) {
        try {
            if (isAlbumTitleExists(title))
                throw new AlreadyExistsException(title);
            Album a = new Album(createItemName());
            Files.createDirectory(root.resolve(a.getId()));
            a.setTitle(title);
            a.setDescription(descr);
            saveAttributes(a);
            fillAttributes(a);
            return a;
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    @Override
    public void updateITem(StorageItem item) {
        try {
            saveAttributes(item);
        } catch (NoSuchFileException | FileNotFoundException e) {
            throw new ItemNotFoundException(e);
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    @Override
    public void deleteAlbum(String albumId) {
        assertUuid(albumId, "Bad album ID");

        try {
            Path path = root.resolve(albumId);
            Files.delete(path);
            Files.delete(getDescriptorFile(path));
        } catch (NoSuchFileException | FileNotFoundException e) {
            throw new ItemNotFoundException(albumId);
        } catch (DirectoryNotEmptyException e) {
            throw new NotEmptyException(albumId);
        } catch (IOException e) {
            throw new InternalException(e);
        }

    }

    @Override
    public void deletePhoto(String albumId, String photoId) throws IllegalArgumentException {
        assertUuid(albumId, "Bad album ID");
        assertUuid(photoId, "Bad photo ID");
        try {
            Path path = root.resolve(albumId).resolve(photoId);
            Files.delete(path);
            Files.delete(path.resolveSibling(photoId+FILE_DESCRIPTOR_EXT));
        } catch (FileNotFoundException | NoSuchFileException e) {
            throw new ItemNotFoundException(albumId + "/" + photoId);
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    @Override
    public boolean isAlbumTitleExists(String title) {
        try {
            return Files.list(root)
                    .filter(p -> UUID_REGEX.matcher(p.getFileName().toString()).matches())
                    .map(this::getDescriptorFile)
                    .filter(Files::isRegularFile)
                    .map(p -> {
                        try (BufferedReader rd = new BufferedReader(new InputStreamReader(new FileInputStream(p.toFile())))) {
                            return rd.readLine();
                        } catch (IOException e) {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .anyMatch(title::equals);
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    @Override
    public Photo savePhoto(String albumId, MultipartFile file, String title, String descr) {
        assertUuid(albumId, "Illegal album ID");
        if (!Files.exists(root.resolve(albumId)))
            throw new ItemNotFoundException(albumId);
        try {
            InputStream in = file.getInputStream();
            Photo photo = new Photo(albumId, createItemName(root.resolve(albumId)));
            Files.copy(in, getPath(photo));
            if (title == null || title.isEmpty())
                title = file.getOriginalFilename();
            photo.setTitle(title);
            photo.setDescription(descr);
            saveAttributes(photo);
            fillAttributes(photo);
            return photo;
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    private static Map<Path, Map<String, Integer>> orderMap = null;

    private static Map<String, Integer> makeOrderMap(Path path) {
        Map<String, Integer> map = new HashMap<>();

        try(BufferedReader rd = new BufferedReader(new InputStreamReader(new FileInputStream(path.resolve(ORDER_FILE_NAME).toFile())))) {
            int n = 0;
            String name;
            while ((name = rd.readLine()) != null) {
                if (UUID_REGEX.matcher(name).matches())
                    map.put(name, n++);
            }
        } catch(
                IOException ignore){ }
        return map;
    }

    private static Map<String, Integer> getOrderMap(Path path) {
        if (orderMap == null)
            orderMap = new HashMap<>();
        return orderMap.computeIfAbsent(path, FileService::makeOrderMap);
    }

    private static void saveOrderMap(Path path) {
        try (BufferedWriter wr = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(path.resolve(ORDER_FILE_NAME).toFile())))) {
            getOrderMap(path).entrySet().stream()
                    .sorted(Comparator.comparing(Map.Entry::getValue))
                    .map(Map.Entry::getKey)
                    .map(s -> s + "\n")
                    .forEachOrdered(s -> {
                        try {
                            wr.write(s);
                            wr.newLine();
                        } catch (IOException e) {
                            throw new InternalException(e);
                        }
                    });
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    private Path getPath(StorageItem item) {
        if (item instanceof Album)
            return root.resolve(item.getId());
        if (item instanceof PhotoItem)
            return root.resolve(((PhotoItem) item).getAlbumId()).resolve(item.getId());
        throw new IllegalArgumentException("Unsupported item type: \"" + item.getClass().getName() + "\"");
    }

    private Path getDescriptorFile(Path file) {
        if (Files.isDirectory(file)) {
            return file.resolve(DIR_DESCRIPTOR_FILE_NAME);
        } else if (Files.isRegularFile(file)) {
            return file.resolveSibling(file.getFileName().toString() + FILE_DESCRIPTOR_EXT);
        } else {
            throw new ItemNotFoundException(root.relativize(file).toString());
        }
    }

    private String createItemName() {
        return createItemName(null);
    }

    private String createItemName(Path parent) {
        if (parent == null)
            parent = root;
        Path newfile = null;
        while (newfile == null || Files.exists(newfile))
            newfile = parent.resolve(UUID.randomUUID().toString());
        return newfile.getFileName().toString();
    }

    public <T extends StorageItem> T fillAttributes(T item) {
        Path file = getDescriptorFile(getPath(item));

        if (Files.exists(file) && Files.isRegularFile(file)) {
            try (BufferedReader rd = new BufferedReader(new InputStreamReader(new FileInputStream(file.toFile())))) {
                String title = rd.readLine();
                String descr = rd.lines().collect(Collectors.joining("\n"));
                item.setTitle(title == null || title.isEmpty() ? null : title);
                item.setDescription(descr == null || descr.isEmpty() ? null : descr);
            } catch (IOException ignore) {}
        }

        try {
            BasicFileAttributes attrs = Files.readAttributes(getPath(item), BasicFileAttributes.class);
            item.setCreated(new Date(attrs.creationTime().toMillis()));
            item.setModified(new Date(attrs.lastModifiedTime().toMillis()));
            if (item instanceof Photo) {
                ((Photo) item).setSize(attrs.size());
                readImageDimension((Photo) item);
            }
        } catch (IOException ignore) {}

        return item;
    }

    @Override
    public Integer getItemOrder(StorageItem item) {
        return getOrderMap(getPath(item).getParent()).get(item.getId());
    }

    @Override
    public void download(String albumId, String photoId, HttpServletResponse response) {
        Path path = root.resolve(albumId).resolve(photoId);
        assertUuid(albumId, "Bad album ID");
        assertUuid(photoId, "Bad photo ID");
        try (BufferedInputStream in = new BufferedInputStream(new FileInputStream(path.toFile()));
                OutputStream out = response.getOutputStream()) {
            response.setContentType(com.drew.imaging.FileTypeDetector.detectFileType(in).getMimeType());
            Files.copy(path, out);
        } catch (NoSuchFileException | FileNotFoundException e) {
            throw new ItemNotFoundException(e);
        } catch (IOException e) {
            throw new InternalException(e);
        }
    }

    private void readImageDimension(Photo photo) {
        File imgFile = getPath(photo).toFile();
        try {
            String mime = com.drew.imaging.FileTypeDetector.detectFileType(new BufferedInputStream(new FileInputStream(imgFile))).getMimeType();
            Iterator<ImageReader> readers = ImageIO.getImageReadersByMIMEType(mime);
            while (readers.hasNext()) {
                ImageReader reader = readers.next();
                try (ImageInputStream stream = new FileImageInputStream(imgFile)) {
                    reader.setInput(stream);
                    photo.setWidth(reader.getWidth(reader.getMinIndex()));
                    photo.setHeight(reader.getHeight(reader.getMinIndex()));
                    return;
                } catch (IOException e) {
                    Logger.getLogger(FileService.class.getName()).log(Level.WARNING, "Error reading image: " + imgFile.getAbsolutePath(), e);
                } finally {
                    if (reader != null)
                        reader.dispose();
                }
            }
            throw new InternalException("Can't find working reader for image file " + imgFile.getAbsolutePath());
        } catch (IOException e) {
            Logger.getLogger(FileService.class.getName()).log(Level.SEVERE, "Error reading image: " + imgFile.getAbsolutePath(), e);
            throw new InternalException("Error reading image: " + imgFile.getAbsolutePath(), e);
        }
    }

    private void saveAttributes(StorageItem item) throws IOException {
        Path file = getDescriptorFile(getPath(item));
        try (BufferedWriter wr = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(file.toFile())))) {
            wr.write(item.getTitle());
            wr.write('\n');
            if (item.getDescription() != null)
                wr.write(item.getDescription());
        }
    }

    private static void assertUuid(String uuid, String message) {
        if (!UUID_REGEX.matcher(uuid).matches())
            throw new IllegalArgumentException(message);
    }

}
