package net.agl.photo.controller;

import net.agl.photo.api.service.PhotoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * @author valinor
 * @since 2018-01-22
 */
@Controller
@RequestMapping
public class MainController {

    @Autowired
    private PhotoService service;

    @ModelAttribute("listUrl")
    public String listUrl() {
        return "photo/";
    }

    @RequestMapping(value = "/admin", method = RequestMethod.GET)
    public String admin() {
        return "treetest";
    }

}
