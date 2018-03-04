package net.agl.photo;

import org.springframework.web.WebApplicationInitializer;
import org.springframework.web.context.ContextLoaderListener;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.context.support.GenericWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;

import javax.servlet.MultipartConfigElement;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRegistration;

/**
 * @author valinor
 * @since 2018-01-16
 */
public class InitApp implements WebApplicationInitializer {
    @Override
    public void onStartup(ServletContext sc) throws ServletException {
        ServletRegistration.Dynamic appServlet =
                sc.addServlet("mvc", new DispatcherServlet(new GenericWebApplicationContext()));
        appServlet.setLoadOnStartup(1);
        appServlet.addMapping("/");
        appServlet.setMultipartConfig(new MultipartConfigElement("/tmp/.photo-tmp-store"));

        AnnotationConfigWebApplicationContext root = new AnnotationConfigWebApplicationContext();
        root.register(WebConfig.class);

        sc.addListener(new ContextLoaderListener(root));

        // Security
//        FilterRegistration.Dynamic filter = sc.addFilter("springSecurityFilterChain", new DelegatingFilterProxy());
//        filter.addMappingForUrlPatterns(null, false, "/*");

    }
}
