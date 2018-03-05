package net.agl.photo.api.model;

import java.util.Map;

/**
 * @author valinor
 * @since 05.03.2018
 */
public interface StorageItemJSON extends StorageItemRO {

    Boolean isFolder();

    Map<String, String> getLinks();

}
